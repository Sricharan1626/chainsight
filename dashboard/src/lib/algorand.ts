import algosdk from 'algosdk';

// ──────────────────────────────────────────────
// Algorand Testnet Client (AlgoNode public endpoint)
// ──────────────────────────────────────────────

const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;
const algodToken = '';

const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// Indexer for looking up confirmed transactions
const indexerServer = 'https://testnet-idx.algonode.cloud';
const indexerClient = new algosdk.Indexer('', indexerServer, algodPort);

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getAccount() {
  const mnemonic = process.env.ALGORAND_WALLET_MNEMONIC;
  if (!mnemonic) {
    throw new Error('ALGORAND_WALLET_MNEMONIC environment variable is required.');
  }
  return algosdk.mnemonicToSecretKey(mnemonic);
}

// ──────────────────────────────────────────────
// Record batch data on-chain
// ──────────────────────────────────────────────

export interface BatchPayload {
  batchId: string;
  batchNumber: string;
  companyName: string;
  currentStage: string;
  status: string;
  entries?: Array<{
    entryType: string;
    notes: string;
    stage: string;
    submittedBy: string;
    roleName: string;
    createdAt?: string;
  }>;
  recordedAt: string;
}

/**
 * Records batch data on the Algorand Testnet as a 0-ALGO transaction note.
 * @returns The Transaction ID (TxID) once confirmed.
 */
export async function recordBatchOnChain(payload: BatchPayload): Promise<string> {
  const account = getAccount();

  // 1. Get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // 2. Encode the payload as a note
  const noteString = JSON.stringify(payload);
  const note = new TextEncoder().encode(noteString);

  // 3. Build a 0-ALGO self-transfer with the note
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: account.addr,
    receiver: account.addr,
    amount: 0,
    note,
    suggestedParams,
  });

  // 4. Sign
  const signedTxn = txn.signTxn(account.sk);
  const txId = txn.txID().toString();

  // 5. Send
  await algodClient.sendRawTransaction(signedTxn).do();

  // 6. Wait for confirmation (up to 4 rounds)
  await algosdk.waitForConfirmation(algodClient, txId, 4);

  return txId;
}

/**
 * Look up a transaction on the Algorand Testnet Indexer.
 * Returns the decoded note string if found, or null.
 */
export async function lookupTransaction(txId: string): Promise<{
  confirmed: boolean;
  round?: number;
  note?: string;
}> {
  try {
    const result = await indexerClient.lookupTransactionByID(txId).do();
    const txn = result.transaction;
    const noteField = txn?.note;
    let noteStr: string | undefined;
    if (noteField) {
      // noteField can be Uint8Array or base64 string depending on SDK version
      if (noteField instanceof Uint8Array) {
        noteStr = new TextDecoder().decode(noteField);
      } else {
        noteStr = new TextDecoder().decode(
          Uint8Array.from(atob(String(noteField)), (c) => c.charCodeAt(0))
        );
      }
    }
    return {
      confirmed: true,
      round: txn?.confirmedRound != null ? Number(txn.confirmedRound) : undefined,
      note: noteStr,
    };
  } catch {
    return { confirmed: false };
  }
}

/**
 * Get the Pera Explorer URL for a transaction.
 */
export function getExplorerUrl(txId: string): string {
  return `https://testnet.explorer.perawallet.app/tx/${txId}`;
}
