import { CategoriesStore } from "./categoriesStore.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.7/prompt/input.ts";
import { Toggle } from "https://deno.land/x/cliffy@v0.25.7/prompt/toggle.ts";

export function categorizePayments(
  payments: string[]
): Promise<Record<string, string>> {
  return CategoriesStore.withCategoriesStore(async (store) => {
    const entries: Array<[string, string]> = [];

    for (const payment of payments) {
      const category = await store.getCategory(payment);

      if (category !== undefined) {
        entries.push([payment, category]);
      } else {
        console.clear();
        console.log(payment + "\n");
        const newCategory = await Input.prompt({
          message: "What category?",
          list: true,
          info: true,
          suggestions: await store.getCategories(),
        });

        const custom = await Toggle.prompt("custom substring");
        let substring = ""
        do {
           
          substring = custom
            ? await Input.prompt({
                message: "substring",
                list: true,
                info: true,
                suggestions: [payment],
              })
            : payment;
        } while (substring.trim().length === 0); 
        

        await store.setCategorySubstring(newCategory, substring);
        entries.push([payment, newCategory]);
      }
    }
    return Object.fromEntries(entries);
  });
}
