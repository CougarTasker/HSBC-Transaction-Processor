import paths from "./data/filePaths.json" assert { type: "json" };

import { readCSV } from "https://deno.land/x/csv/mod.ts";


import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";
type transaction = {
  date: moment.Moment;
  reference: string;
  amount: number;
};

async function parseTransactionRow(row: AsyncIterable<string>): Promise<transaction> {
  const rowIterator = row[Symbol.asyncIterator]();
  const { value: dateString } = await rowIterator.next();
  const date = moment(dateString, "DD/MM/YYYY");
  const { value: reference } = await rowIterator.next();
  const { value: amountString } = await rowIterator.next();
  const amount = parseFloat(amountString);
  return { date, reference, amount };
}

export async function loadTransactions(): Promise<Array<transaction>> {
  const newLocal = import.meta.resolve(paths.transactions).replace("file://","");
  const transactionFile = await Deno.open(
    newLocal
  );
  const out = []
  for await (const row of readCSV(transactionFile,{
    lineSeparator:"\r\n"
  })) {
    out.push(await parseTransactionRow(row));
  }
  return out
}
