import { z } from "https://deno.land/x/zod/mod.ts";

const categoriesFile = z.record(z.array(z.string()));

export class CategoriesStore {
  private categories: Promise<z.infer<typeof categoriesFile>>;
  private readonly filePath = import.meta
    .resolve("./categories.json")
    .replace("file://", "");
  private constructor() {
    this.categories = (async () => {
      try {
        const fileContents: unknown = JSON.parse(
          await Deno.readTextFile(this.filePath)
        );
        return categoriesFile.parseAsync(fileContents);
      } catch (_exception) {
        return {};
      }
    })();
  }
  public static async withCategoriesStore<T>(
    categoryStore: (store: CategoriesStore) => Promise<T> | T
  ): Promise<T> {
    const store = new CategoriesStore();
    let startedExecution = false;
    let doneExecution: () => void = () => null;
    const interval = setInterval(async () => {
      startedExecution = true;
      await store.saveCategories();
      startedExecution = false;
      doneExecution();
    }, 1000);
    const out = await categoryStore(store);
    clearInterval(interval);
    await new Promise<null>((res) => {
      if (!startedExecution) {
        return res(null);
      }
      doneExecution = () => res(null);
    });
    await store.saveCategories();
    return out;
  }
  async saveCategories() {
    await Deno.writeTextFile(this.filePath, JSON.stringify(this.categories));
  }
  async getCategories(): Promise<string[]> {
    return Object.keys(await this.categories);
  }
  async setCategorySubstring(categoryName: string, substring: string) {
    this.categories = {
      ...this.categories,
      [categoryName]: [
        ...((await this.categories)[categoryName] || []),
        substring.toLowerCase().trim(),
      ],
    };
  }
  /**
   * super in efficient but automatically gets the category for a given reference
   *
   * @param reference the reference string
   * @returns the category name that has the longest substring that is in the reference
   */
  async getCategory(reference: string): Promise<string | undefined> {
    return Array.from(Object.entries(await this.categories))
      .map(([name, substrings]) =>
        substrings.map((substring) => ({ substring, name }))
      )
      .flat()
      .filter(({ substring }) => reference.toLowerCase().includes(substring))
      .reduce<{ substring: string; name: string } | undefined>(
        (longestMatch, current) =>
          longestMatch === undefined ||
          longestMatch.substring.length < current.substring.length
            ? current
            : longestMatch,
        undefined
      )?.name;
  }
}
