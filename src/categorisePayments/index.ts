import { CategoriesStore } from "./categoriesStore.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.7/prompt/input.ts";
import { Toggle } from "https://deno.land/x/cliffy@v0.25.7/prompt/toggle.ts";
import { Transaction } from "../loadTransactions.ts";
import { Table } from "https://deno.land/x/cliffy@v0.25.7/table/mod.ts";

export type categorisedTransaction = Transaction & {
  category: string;
};

export function categorizePayments(
  payments: Transaction[]
): Promise<categorisedTransaction[]> {
  return CategoriesStore.withCategoriesStore(async (store) => {
    const entries: Array<categorisedTransaction> = [];

    for (const payment of payments) {
      const category = await store.getCategory(payment.reference);

      if (category !== undefined) {
        entries.push({ ...payment, category });
      } else {
        console.clear();
        
        printPayment(payment);
        const newCategory = await Input.prompt({
          message: "What category?",
          list: true,
          info: true,
          suggestions: await store.getCategories(),
        });

        const custom = await Toggle.prompt("custom substring");
        let substring = "";
        do {
          substring = custom
            ? await Input.prompt({
                message: "substring",
                list: true,
                info: true,
                suggestions: [payment.reference],
              })
            : payment.reference;
        } while (substring.trim().length === 0);

        await store.setCategorySubstring(newCategory, substring);
        entries.push({ ...payment, category: newCategory });
      }
    }
    return entries;
  });
}

function printPayment(payment: Transaction) {
  console.log(`Transaction details:\n`);
  const paymentDetailsTable = new Table();
  paymentDetailsTable.push(["reference", payment.reference]);
  paymentDetailsTable.push(["amount", formatAmountString(payment.amount)]);
  paymentDetailsTable.push(["date", payment.date.toLocaleString()]);
  paymentDetailsTable.border(true);
  paymentDetailsTable.render();
}


import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
function formatAmountString(amount:number): string{
    const colour = amount >0? colors.green : colors.red
    return colour( Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Math.abs(amount)));
}