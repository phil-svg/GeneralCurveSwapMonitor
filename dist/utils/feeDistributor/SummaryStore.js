import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFile } from 'fs/promises';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SUMMARY_PATH = path.join(__dirname, '../src/savedFiles/fee_summary_data.json');
function ensureSummaryFile() {
    try {
        if (!fs.existsSync(SUMMARY_PATH)) {
            const initial = {
                events: [],
                processedTimestamps: [],
                highestProcessedBlock: 0,
            };
            fs.writeFileSync(SUMMARY_PATH, JSON.stringify(initial, null, 2));
        }
        const data = fs.readFileSync(SUMMARY_PATH, 'utf8');
        const parsed = JSON.parse(data);
        if (typeof parsed.highestProcessedBlock !== 'number') {
            parsed.highestProcessedBlock = 0;
        }
        return parsed;
    }
    catch (err) {
        console.error('Failed to load summary file:', err);
        return {
            events: [],
            processedTimestamps: [],
            highestProcessedBlock: 0,
        };
    }
}
function writeSummaryFile(data) {
    fs.writeFileSync(SUMMARY_PATH, JSON.stringify(data, null, 2));
}
export async function saveSummaryEvent(event) {
    const data = ensureSummaryFile();
    if (event.blockNumber <= data.highestProcessedBlock)
        return;
    const alreadyExists = data.events.some((e) => e.txHash === event.txHash &&
        e.sender === event.sender &&
        e.value === event.value &&
        e.blockNumber === event.blockNumber &&
        e.handler === event.handler);
    if (!alreadyExists) {
        data.events.push(event);
        writeSummaryFile(data);
    }
}
export async function loadSummaryStore() {
    return ensureSummaryFile();
}
export async function flushSummaryStore() {
    const data = ensureSummaryFile();
    const maxBlock = data.events.reduce((max, e) => Math.max(max, e.blockNumber), data.highestProcessedBlock);
    data.events = [];
    data.highestProcessedBlock = maxBlock;
    writeSummaryFile(data);
}
async function wasSummaryProcessed(timestampMs) {
    const data = ensureSummaryFile();
    return data.processedTimestamps.includes(timestampMs);
}
export async function markSummaryProcessed(timestampMs) {
    const data = ensureSummaryFile();
    if (!data.processedTimestamps.includes(timestampMs)) {
        data.processedTimestamps.push(timestampMs);
    }
    writeSummaryFile(data);
}
export async function shouldPostSummary() {
    const ts = await getLatestSeenTimestamp();
    if (!ts)
        return { shouldPost: false, timestamp: new Date(0) };
    const lastTuesday = getLastTuesdayAt16UTC(ts);
    const nextTuesday = new Date(lastTuesday.getTime());
    nextTuesday.setUTCDate(lastTuesday.getUTCDate() + 7);
    const now = new Date();
    const alreadyProcessed = await wasSummaryProcessed(lastTuesday.getTime());
    const shouldPost = now >= lastTuesday && now < nextTuesday && !alreadyProcessed;
    return { shouldPost, timestamp: lastTuesday };
}
export async function getLatestSeenTimestamp() {
    const LAST_SEEN_PATH = './lastSeen.json';
    try {
        const content = await readFile(LAST_SEEN_PATH, 'utf8');
        const { txTimestamp } = JSON.parse(content);
        return txTimestamp ? new Date(txTimestamp) : null;
    }
    catch (err) {
        console.warn('Failed to read lastSeen.json:', err);
        return null;
    }
}
function getLastTuesdayAt16UTC(ref) {
    const date = new Date(ref);
    const day = date.getUTCDay();
    const diffToTuesday = (day + 7 - 2) % 7; // 2 = Tuesday
    date.setUTCDate(date.getUTCDate() - diffToTuesday);
    date.setUTCHours(16, 0, 0, 0);
    return date;
}
//# sourceMappingURL=SummaryStore.js.map