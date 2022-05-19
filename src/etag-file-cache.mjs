import { readFile,writeFile } from "fs/promises";

export class ETagFileCache {
  #entries = new Map();

  constructor(fileName) {
    this.fileName = fileName;

    this.load();
  }

  async load() {
    for (const [k, v] of Object.entries(
      JSON.parse(await readFile(this.fileName, { encoding: "utf8" }))
    )) {
      this.#entries.set(k, v);
    }
  }

  persist() {
    const data = JSON.stringify(Object.fromEntries(this.#entries.entries()));
//console.log(data);
    writeFile(this.fileName, data, {
      encoding: "utf8"
    });
  }

  header(url) {
    const entry = this.#entries.get(url);
    if(entry) {
    console.log("found", url, entry[0]);
    }
    return entry ? { "If-Match": entry[0] } : {};
  }

  data(url) {
    const entry = this.#entries.get(url);
    return entry ? entry[1] : undefined;
  }

  store(url, etag, json) {
//    console.log("store", url, etag);
    this.#entries.set(url, [etag, json]);
    this.persist();
  }
}
