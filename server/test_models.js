import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testModels() {
    try {
        const modelsDir = path.join(__dirname, 'src', 'models');
        const files = fs.readdirSync(modelsDir);

        console.log(`Found ${files.length} models. Loading...`);
        for (const file of files) {
            if (file.endsWith('.js')) {
                await import(`./src/models/${file}`);
                console.log(`✅ Loaded ${file}`);
            }
        }
        console.log('🎉 All models loaded successfully! Mongoose schema definitions are valid.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error loading models:', err);
        process.exit(1);
    }
}

testModels();
