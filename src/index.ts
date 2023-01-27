import { categorizePayments } from "./categorisePayments/index.ts";
import { loadTransactions } from "./loadTransactions.ts";

const transactions = await loadTransactions();
categorizePayments(transactions.map(({ reference }) => reference));
