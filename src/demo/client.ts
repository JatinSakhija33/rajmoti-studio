import { localBucket, resolveMedia, persistable } from "./media-storage";
import { seed } from "./data";
const KEY = "rajmoti:preview:database:v1";
let db: any;
function database() {
  if (!db) {
    try {
      db = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {}
    db ||= structuredClone(seed);
  }
  return db;
}
function persist() {
  localStorage.setItem(KEY, JSON.stringify(persistable(database())));
}
class Query {
  table: string;
  filters: ((r: any) => boolean)[] = [];
  sorts: any[] = [];
  one = false;
  start = 0;
  end = Infinity;
  action = "read";
  payload: any;
  count = false;
  constructor(table: string) {
    this.table = table;
  }
  select(_fields?: any, options?: any) {
    this.count = !!options?.count;
    return this;
  }
  eq(k: string, v: any) {
    this.filters.push((r) => r[k] === v);
    return this;
  }
  neq(k: string, v: any) {
    this.filters.push((r) => r[k] !== v);
    return this;
  }
  is(k: string, v: any) {
    this.filters.push((r) => (r[k] ?? null) === v);
    return this;
  }
  in(k: string, v: any[]) {
    this.filters.push((r) => v.includes(r[k]));
    return this;
  }
  gte(k: string, v: any) {
    this.filters.push((r) => r[k] >= v);
    return this;
  }
  lte(k: string, v: any) {
    this.filters.push((r) => r[k] <= v);
    return this;
  }
  gt(k: string, v: any) {
    this.filters.push((r) => r[k] > v);
    return this;
  }
  lt(k: string, v: any) {
    this.filters.push((r) => r[k] < v);
    return this;
  }
  ilike(k: string, v: string) {
    this.filters.push((r) =>
      String(r[k] || "")
        .toLowerCase()
        .includes(v.replace(/%/g, "").toLowerCase()),
    );
    return this;
  }
  or() {
    return this;
  }
  not() {
    return this;
  }
  order(k: string, o?: any) {
    this.sorts.push([k, o?.ascending !== false]);
    return this;
  }
  limit(n: number) {
    this.end = this.start + n;
    return this;
  }
  range(a: number, b: number) {
    this.start = a;
    this.end = b + 1;
    return this;
  }
  maybeSingle() {
    this.one = true;
    return this;
  }
  single() {
    this.one = true;
    return this;
  }
  insert(v: any) {
    this.action = "insert";
    this.payload = persistable(v);
    return this;
  }
  upsert(v: any) {
    this.action = "upsert";
    this.payload = persistable(v);
    return this;
  }
  update(v: any) {
    this.action = "update";
    this.payload = persistable(v);
    return this;
  }
  delete() {
    this.action = "delete";
    return this;
  }
  then(resolve: any, reject?: any) {
    return Promise.resolve()
      .then(async () => {
        const rows = (database()[this.table] ||= []);
        let matches = rows.filter((r: any) => this.filters.every((f) => f(r)));
        if (this.action === "upsert" || this.action === "insert") {
          matches = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((r: any) => ({
            ...r,
            id: r.id || crypto.randomUUID(),
            ...(this.table === "images"
              ? {
                  short_id: r.short_id || crypto.randomUUID().slice(0, 8),
                  created_at: r.created_at || new Date().toISOString(),
                }
              : {}),
          }));
          for (const row of matches) {
            const idx = rows.findIndex((r: any) =>
              this.table === "site_content" ? r.section_key === row.section_key : r.id === row.id,
            );
            if (this.action === "upsert" && idx >= 0) rows[idx] = row;
            else rows.push(row);
          }
          persist();
        }
        if (this.action === "update") {
          matches.forEach((r: any) => Object.assign(r, this.payload));
          persist();
        }
        if (this.action === "delete") {
          database()[this.table] = rows.filter((r: any) => !matches.includes(r));
          persist();
        }
        matches.sort((a: any, b: any) => {
          for (const [k, asc] of this.sorts) {
            const c = String(a[k] ?? "").localeCompare(String(b[k] ?? ""), undefined, {
              numeric: true,
            });
            if (c) return asc ? c : -c;
          }
          return 0;
        });
        if (this.table === "images")
          matches = matches.map((row: any) => ({
            ...row,
            categories: database().categories.find((c: any) => c.id === row.category_id) || null,
            subcategories:
              database().subcategories.find((c: any) => c.id === row.subcategory_id) || null,
          }));
        const count = matches.length;
        matches = matches.slice(this.start, this.end);
        return {
          data: await resolveMedia(this.one ? (matches[0] ?? null) : structuredClone(matches)),
          error: null,
          count,
        };
      })
      .then(resolve, reject);
  }
}
const blocked = async () => ({
  data: null,
  error: new Error("Disabled in demonstration preview: no uploads, payments or external services."),
});
export const demoClient: any = {
  from: (table: string) => new Query(table),
  rpc: async (name: string) => ({ data: name === "has_role" ? true : [], error: null }),
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    getSession: async () => ({
      data: { session: { user: { id: "demo-owner", email: "demo@example.invalid" } } },
    }),
    getUser: async () => ({ data: { user: { id: "demo-owner", email: "demo@example.invalid" } } }),
    signOut: async () => ({ error: null }),
    signInWithPassword: blocked,
    signUp: blocked,
    resetPasswordForEmail: blocked,
    updateUser: blocked,
    signInWithOAuth: blocked,
  },
  functions: { invoke: blocked },
  storage: { from: localBucket },
  channel: () => ({
    on() {
      return this;
    },
    subscribe() {
      return this;
    },
  }),
  removeChannel() {},
};
