// Quick Mock Tokenizer calculation (Word characters approximate to tokens fractions)
function estimateTokens(text) {
    if (!text.trim()) return 0;
    return Math.ceil(text.split(/[\s\p{P}]+/u).filter(Boolean).length * 1.3);
}

function runTruncation() {
    const rawText = document.getElementById('inputText').value;
    const maxTokens = parseInt(document.getElementById('maxTokens').value);
    const windowSize = parseInt(document.getElementById('windowSize').value);
    const keepSystem = document.getElementById('keepSystem').checked;

    let systemPrompt = "";
    let bodyText = rawText;

    // 1. Isolate Core System Prompts if Pinned
    if (keepSystem && rawText.toUpperCase().startsWith("SYSTEM:")) {
        const lines = rawText.split("\n");
        systemPrompt = lines[0] + "\n\n";
        bodyText = lines.slice(1).join("\n");
    }

    const sysTokenCount = estimateTokens(systemPrompt);
    const maxBodyTokens = maxTokens - sysTokenCount;

    // Split text context chunks roughly by lines for interactive processing visibility
    const blocks = bodyText.split("\n").filter(line => line.trim() !== "");
    
    let processedHTML = "";
    let acceptedText = systemPrompt;
    
    if (systemPrompt) {
        processedHTML += `<span class="highlight-system">${systemPrompt}</span>`;
    }

    // 2. Execute Iterative Sliding Window Pass (Bottom-up priority for message logs)
    let currentBodyTokens = 0;
    let outputs = [];

    // Process chronological streams backwards to keep the latest historical context intact
    for (let i = blocks.length - 1; i >= 0; i--) {
        let blockTokens = estimateTokens(blocks[i]);
        
        if (currentBodyTokens + blockTokens <= maxBodyTokens) {
            currentBodyTokens += blockTokens;
            outputs.unshift(`<span class="highlight-kept">${blocks[i]}</span>`);
            acceptedText += blocks[i] + "\n";
        } else {
            outputs.unshift(`<span class="highlight-dropped">${blocks[i]} (Pruned Sliding Window Context Block)</span>`);
        }
    }

    processedHTML += outputs.join("\n");

    // 3. Render Output & Metrics Breakdown
    const totalRawTokens = estimateTokens(rawText);
    const finalTokens = estimateTokens(acceptedText);
    const savings = totalRawTokens > 0 ? Math.round(((totalRawTokens - finalTokens) / totalRawTokens) * 100) : 0;

    document.getElementById('outputText').innerHTML = processedHTML;
    document.getElementById('rawTokens').innerText = totalRawTokens;
    document.getElementById('optimizedTokens').innerText = finalTokens;
    document.getElementById('savingsPct').innerText = `${savings}%`;
}

document.getElementById('runBtn').addEventListener('click', runTruncation);
// Initial run
window.onload = runTruncation;
