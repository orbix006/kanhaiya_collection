"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface LocationContextType {
  location: string | null;
  setLocation: (loc: string) => void;
  isModalOpen: boolean;
  openModal: (isInitialPrompt?: boolean) => void;
  closeModal: () => void;
  isFirstVisitPrompt: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFirstVisitPrompt, setIsFirstVisitPrompt] = useState(false);

  useEffect(() => {
    // Check if location was previously saved in client storage
    const saved = localStorage.getItem("kanhaiya_selected_location");
    if (saved) {
      setLocationState(saved);
    }

    // Check if first-time visitor needs to be prompted
    const prompted = localStorage.getItem("kanhaiya_location_prompted");
    if (!prompted) {
      const timer = setTimeout(() => {
        setIsFirstVisitPrompt(true);
        setIsModalOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const setLocation = (loc: string) => {
    const trimmed = loc.trim();
    setLocationState(trimmed);
    localStorage.setItem("kanhaiya_selected_location", trimmed);
    localStorage.setItem("kanhaiya_location_prompted", "true");
  };

  const openModal = (isInitial = false) => {
    setIsFirstVisitPrompt(isInitial);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    localStorage.setItem("kanhaiya_location_prompted", "true");
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        isModalOpen,
        openModal,
        closeModal,
        isFirstVisitPrompt,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
