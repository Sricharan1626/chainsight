require('dotenv').config();
const algosdk = require('algosdk');
const { Pool } = require('pg');

// Initialize PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Algorand Client for Testnet
// Using AlgoNode which provides free public endpoints for Testnet
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

/**
 * Records a critical supply chain risk event to the Algorand Testnet.
 * @param {Object} riskData JSON object containing risk data (e.g., Batch ID, Delay Duration, Confidence Score).
 * @returns {Promise<string>} The resulting Transaction ID (TxID).
 */
async function recordRiskEvent(riskData) {
  if (!riskData || !riskData['Batch ID']) {
    throw new Error('riskData must contain a "Batch ID" field.');
  }

  const batchId = riskData['Batch ID'];

  // Central Wallet Account (Mnemonic should be securely stored in env)
  const passphrase = process.env.ALGORAND_WALLET_MNEMONIC;
  if (!passphrase) {
    throw new Error('ALGORAND_WALLET_MNEMONIC environment variable is required.');
  }
  let centralAccount;
  try {
    centralAccount = algosdk.mnemonicToSecretKey(passphrase);
  } catch (err) {
    throw new Error('Invalid ALGORAND_WALLET_MNEMONIC provided.');
  }

  try {
    // 1. Get suggested transaction params
    const suggestedParams = await algodClient.getTransactionParams().do();

    // 2. Embed the JSON payload into the `note` field (must be Uint8Array)
    const noteString = JSON.stringify(riskData);
    const note = new TextEncoder().encode(noteString);

    // 3. Construct a 0-ALGO transaction
    // Sending from the central wallet to itself to simply record the note on-chain.
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: centralAccount.addr.toString(),
      to: centralAccount.addr.toString(), // Self-transfer
      amount: 0,
      note: note,
      suggestedParams: suggestedParams,
    });

    // 4. Sign the transaction
    const signedTxn = txn.signTxn(centralAccount.sk);
    const txId = txn.txID().toString();
    console.log(`Signed transaction with txID: ${txId}`);

    // 5. Send the transaction to the Testnet
    await algodClient.sendRawTransaction(signedTxn).do();
    console.log(`Transaction ${txId} submitted to network. Waiting for confirmation...`);

    // 6. Wait for confirmation
    const confirmation = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log(`Transaction ${txId} confirmed in round ${confirmation['confirmed-round']}`);

    // 7. Save TxID to the PostgreSQL database for the specific 'Batch' record
    console.log(`Saving TxID to PostgreSQL database for Batch ID: ${batchId}...`);
    const updateQuery = `
      UPDATE "Batch"
      SET "algorand_tx_id" = $1,
          "risk_recorded_at" = NOW()
      WHERE "id" = $2
      RETURNING *;
    `;
    // We assume the Batch table has an 'id' column mapping to batchId, or 'batch_id'
    // Depending on schema, we might use "batch_id" = $2, but standard naming is assumed.
    const result = await pool.query(updateQuery, [txId, batchId]);
    
    if (result.rowCount === 0) {
      console.warn(`Warning: No Batch record found in DB with ID ${batchId} to update.`);
    } else {
      console.log(`Successfully updated database record for Batch ID: ${batchId}`);
    }

    return txId;

  } catch (error) {
    console.error('Failed to record risk event:', error);
    throw error;
  }
}

module.exports = {
  recordRiskEvent,
  pool // Exported for testing/closing purposes
};

// Example usage if executed directly
if (require.main === module) {
  const sampleRiskEvent = {
    "Batch ID": "BATCH-7890",
    "Delay Duration": "48 hours",
    "Confidence Score": 0.95,
    "Event Type": "Temperature Excursion Warning",
    "Timestamp": new Date().toISOString()
  };

  recordRiskEvent(sampleRiskEvent)
    .then(txId => {
      console.log(`Risk event successfully recorded! TxID: ${txId}`);
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
