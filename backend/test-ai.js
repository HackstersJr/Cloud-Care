import { GoogleGenerativeAI } from '@google/generative-ai';

// Test the AI service directly
async function testAI() {
  const apiKey = 'AIzaSyAWz4pZRDx5OJbFDsQqK1-s8dTjTfXcOig';
  console.log('Testing AI with API key:', apiKey.slice(0, 10) + '...');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log(`\nTrying with model: gemini-2.5-flash`);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = 'Say hello, this is a test for medical AI insights!';
    console.log('Sending test prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('AI Response:', text);
    console.log(`✅ Model gemini-2.5-flash works!`);
    return { modelName: 'gemini-2.5-flash', text };
  } catch (error) {
    console.log(`❌ Model gemini-2.5-flash failed:`, error.message);
    throw error;
  }
}

testAI().then((result) => {
  console.log('\n🎉 AI test completed successfully!');
  console.log('Working model:', result.modelName);
}).catch((err) => {
  console.error('❌ AI model failed:', err.message);
});
