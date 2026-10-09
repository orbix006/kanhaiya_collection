"use client";

import React, { useState } from "react";
import { useLocation } from "./location-context";
import { MapPin, Navigation, X, Loader2, Check, AlertCircle } from "lucide-react";

/**
 * Reverse geocodes coordinates to a clean, human-readable Indian locality or city.
 * Never exposes raw coordinates to the user.
 */
async function reverseGeocodeCoords(latitude: number, longitude: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.localityInfo?.administrative?.[2]?.name;
      const state = data.principalSubdivision;
      if (city && state) {
        return `${city}, ${state}`;
      }
      if (city) return city;
      if (state) return state;
      if (data.countryName) return data.countryName;
    }
  } catch {
    // Graceful fallback to nearest region if offline or network blocked
  }

  // Known coordinate approximations for Indian metros
  if (Math.abs(latitude - 28.6) < 1.0 && Math.abs(longitude - 77.2) < 1.0) {
    return "Delhi NCR, India";
  }
  if (Math.abs(latitude - 19.0) < 1.0 && Math.abs(longitude - 72.8) < 1.0) {
    return "Mumbai, Maharashtra";
  }
  if (Math.abs(latitude - 12.9) < 1.0 && Math.abs(longitude - 77.6) < 1.0) {
    return "Bengaluru, Karnataka";
  }
  if (Math.abs(latitude - 25.3) < 1.0 && Math.abs(longitude - 83.0) < 1.0) {
    return "Varanasi, Uttar Pradesh";
  }
  if (Math.abs(latitude - 27.5) < 1.0 && Math.abs(longitude - 77.6) < 1.0) {
    return "Mathura, Uttar Pradesh";
  }
  return "India";
}

export function LocationModal() {
  const { location, setLocation, isModalOpen, closeModal, isFirstVisitPrompt } = useLocation();
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isModalOpen) return null;

  const handleUseCurrentLocation = () => {
    setErrorMessage(null);

    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      setShowManualInput(true);
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const readableName = await reverseGeocodeCoords(
            position.coords.latitude,
            position.coords.longitude
          );
          setLocation(readableName);
          setIsDetecting(false);
          closeModal();
        } catch {
          setLocation("India");
          setIsDetecting(false);
          closeModal();
        }
      },
      (error) => {
        setIsDetecting(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage("Location access was denied.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMessage("Location information is currently unavailable.");
        } else if (error.code === error.TIMEOUT) {
          setErrorMessage("Location request timed out.");
        } else {
          setErrorMessage("An error occurred while retrieving location.");
        }
        setShowManualInput(true);
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
      }
    );
  };

  const handleSaveManualLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setLocation(manualInput.trim());
      setManualInput("");
      setShowManualInput(false);
      setErrorMessage(null);
      closeModal();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
    >
      <div className="relative w-full max-w-md bg-[#FFFDF7] border border-[#E8DCC8] rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden text-[#3B2416]">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close location modal"
          className="absolute top-4 right-4 p-2 rounded-full text-[#806B57] hover:text-[#3B2416] hover:bg-[#F8F1E3] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F8F1E3] to-[#E8DCC8] ring-1 ring-[#C8891A]/30 text-[#C8891A] mb-4">
          <MapPin className="h-6 w-6" />
        </div>

        {/* Heading & Supporting text */}
        <h2 id="location-dialog-title" className="font-serif text-2xl font-semibold tracking-tight text-[#3B2416]">
          {isFirstVisitPrompt ? "Where are you located?" : "Your Location"}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#806B57] leading-relaxed font-normal">
          {isFirstVisitPrompt
            ? "Allow location access to help us provide a better shopping experience."
            : "Select your delivery location to explore regional availability and offerings."}
        </p>

        {/* Active Location Display if set */}
        {location && (
          <div className="mt-4 p-3 rounded-xl bg-[#F8F1E3] border border-[#E8DCC8] flex items-center justify-between text-xs text-[#3B2416]">
            <div className="flex items-center gap-2">
              <span className="text-[#C8891A] font-medium">Active:</span>
              <span className="font-medium truncate max-w-[220px]">{location}</span>
            </div>
            <Check className="h-4 w-4 text-[#C8891A]" />
          </div>
        )}

        {/* Error message / Permission denied warning */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium">{errorMessage}</p>
              <p className="mt-0.5 text-[11px] text-amber-700 font-normal">Please enter your city, area, or pincode below.</p>
            </div>
          </div>
        )}

        {/* Main Location Options */}
        <div className="mt-6 space-y-3 font-sans">
          {/* Button: Use Current Location */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isDetecting}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8891A] text-white font-medium text-sm hover:bg-[#B37814] active:bg-[#9E690F] transition-all disabled:opacity-60 shadow-xs"
          >
            {isDetecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Requesting location...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                <span>Use Current Location</span>
              </>
            )}
          </button>

          {/* Toggle or Show Manual Entry */}
          {!showManualInput && (
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-[#3B2416] font-medium text-sm hover:bg-[#F8F1E3] hover:border-[#C8891A]/50 transition-all"
            >
              <span>Enter Location Manually</span>
            </button>
          )}

          {/* Manual Input Form */}
          {showManualInput && (
            <form onSubmit={handleSaveManualLocation} className="pt-2 space-y-3">
              <div className="text-left">
                <label
                  htmlFor="manual-location-input"
                  className="block text-[11px] font-medium uppercase tracking-wider text-[#806B57] mb-1.5"
                >
                  Enter your city, area or pincode
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#806B57]/70" />
                  <input
                    id="manual-location-input"
                    type="text"
                    required
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. Noida, Delhi, or 201301"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] placeholder-[#806B57]/60 font-normal focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#8B4513] text-white font-medium text-sm hover:bg-[#72380F] transition-all shadow-xs"
                >
                  Save Location
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="px-4 h-11 rounded-xl border border-[#E8DCC8] text-xs font-medium text-[#806B57] hover:bg-[#F8F1E3]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
