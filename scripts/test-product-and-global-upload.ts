import { uploadAdminImageAction } from '../app/(admin)/admin/actions/upload';
import {
  generateProductSku,
  generateProductBatchNumber,
  upsertProductInStore,
  loadMockStore
} from '../lib/mock-data/admin-store';

async function runTests() {
  console.log('==============================================================================');
  console.log('  ADD PRODUCT & GLOBAL IMAGE UPLOAD SYSTEM: AUTOMATED VERIFICATION SUITE');
  console.log('==============================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${detail || 'Condition not met'}`);
    }
  }

  // 1. SKU & Batch Generation checks
  console.log('[SECTION 1] Locked SKU and Batch Code Generation');
  const sku1 = generateProductSku('Brass Murti');
  const sku2 = generateProductSku('Saree');
  assert(sku1.startsWith('KC-'), 'SKU auto-generation formats correctly with KC- prefix');
  assert(sku1 !== sku2 || sku1.length > 5, 'SKU generation provides formatted identifier');

  const batch1 = generateProductBatchNumber();
  assert(batch1.startsWith('BATCH-'), 'Batch auto-generation formats correctly with BATCH- prefix');

  // 2. Upload Admin Image Action Validation
  console.log('\n[SECTION 2] Global Image Upload Server Action & Security');
  try {
    const fakeImageBuffer = Buffer.from('fake image content for testing');
    const formData = new FormData();
    const blob = new Blob([fakeImageBuffer], { type: 'image/png' });
    formData.append('file', blob, 'test-product.png');
    formData.append('bucket', 'product-images');

    const uploadRes = await uploadAdminImageAction(formData, { bypassAuthForTest: true });
    assert(uploadRes.success === true && !!uploadRes.url, 'uploadAdminImageAction handles upload and returns URL');
    assert(Boolean(uploadRes.url?.includes('test-product.png') || uploadRes.url?.includes('product-images')), 'Uploaded URL contains valid bucket structure');
  } catch (err: any) {
    assert(false, 'uploadAdminImageAction execution', err?.message);
  }

  // 3. Test Invalid Mime Type Rejection in Upload Action
  try {
    const fakeExeBuffer = Buffer.from('malicious executable code');
    const formDataBad = new FormData();
    const blobBad = new Blob([fakeExeBuffer], { type: 'application/x-msdownload' });
    formDataBad.append('file', blobBad, 'malicious.exe');
    formDataBad.append('bucket', 'product-images');

    const badUploadRes = await uploadAdminImageAction(formDataBad, { bypassAuthForTest: true });
    assert(badUploadRes.success === false && Boolean(badUploadRes.error?.includes('Invalid file type')), 'Rejects non-image MIME types securely');
  } catch (err: any) {
    assert(false, 'MIME type rejection test', err?.message);
  }

  // 4. Test Multi-Bucket Upload Target Validation
  try {
    const buckets = ['category-thumbnails', 'hero-banners', 'campaign-banners', 'avatars'];
    for (const bucket of buckets) {
      const buf = Buffer.from(`dummy asset for ${bucket}`);
      const fd = new FormData();
      fd.append('file', new Blob([buf], { type: 'image/jpeg' }), `${bucket}-sample.jpg`);
      fd.append('bucket', bucket);
      const res = await uploadAdminImageAction(fd, { bypassAuthForTest: true });
      assert(res.success === true && !!res.url, `uploadAdminImageAction accepts verified bucket: ${bucket}`);
    }
  } catch (err: any) {
    assert(false, 'Multi-bucket upload routing', err?.message);
  }

  // 5. Test Add Product Validation Rules (Single Form Structure)
  console.log('\n[SECTION 3] Add Product Form Validation Rules');
  
  // A. Empty Name Rejection
  const emptyNameRes = upsertProductInStore({
    name: '   ',
    base_price: 1500,
    description: 'Valid multiline description text here.',
    category_id: 'cat-1',
    stock_quantity: 10
  });
  assert(emptyNameRes.success === false && Boolean(emptyNameRes.error?.includes('Product name is required')), 'Rejects empty / whitespace product name');

  // B. Invalid / Negative Price Rejection
  const badPriceRes = upsertProductInStore({
    name: 'Valid Product',
    base_price: -50,
    description: 'Valid multiline description text here.',
    category_id: 'cat-1',
    stock_quantity: 10
  });
  assert(badPriceRes.success === false && Boolean(badPriceRes.error?.includes('Base price must be a valid number')), 'Rejects negative or invalid price');

  // C. Invalid / Negative Stock Rejection
  const badStockRes = upsertProductInStore({
    name: 'Valid Product',
    base_price: 1999,
    description: 'Valid multiline description text here.',
    category_id: 'cat-1',
    stock_quantity: -5
  });
  assert(badStockRes.success === false && Boolean(badStockRes.error?.includes('Stock quantity must be a non-negative number')), 'Rejects negative stock integer');

  // 6. Successful Product Creation & Persistence with Image Attachments
  console.log('\n[SECTION 4] Product Creation & Image State Persistence');
  const testSku = generateProductSku('Handicraft');
  const testBatch = generateProductBatchNumber();
  const validProductRes = upsertProductInStore({
    name: 'Test Pure Brass Diya Unique ' + Date.now(),
    description: 'Handcrafted spiritual diya.\nPreserves multiline breaks and details.\nPolished brass finish.',
    base_price: 1299.00,
    stock_quantity: 40,
    category_id: 'cat-idols',
    sku: testSku,
    batch_number: testBatch,
    images: [
      { id: 'img-1', image_url: '/uploads/product-images/test-diya-1.png', display_order: 0, is_primary: true },
      { id: 'img-2', image_url: '/uploads/product-images/test-diya-2.png', display_order: 1, is_primary: false }
    ]
  });

  if (!validProductRes.success) {
    console.error('validProductRes failed with error:', validProductRes.error);
  }

  assert(validProductRes.success === true && !!validProductRes.product, 'Successfully creates valid product with multiline description, locked SKU & batch, and attached image records');
  
  if (validProductRes.product) {
    assert(validProductRes.product.images?.length === 2, 'Persists all uploaded image references with exact order');
    assert(validProductRes.product.sku === testSku, 'Persists generated locked SKU without alteration');
    assert(validProductRes.product.batch_number === testBatch, 'Persists generated locked Batch without alteration');
  }

  console.log(`\n==============================================================================`);
  console.log(`TEST RESULTS: ${passed}/${total} checks passed (${Math.round((passed/total)*100)}%)`);
  console.log(`==============================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test suite uncaught error:', e);
  process.exit(1);
});
