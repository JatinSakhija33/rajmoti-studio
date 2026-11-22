// Offline read fallback. Studio records come only from the configured database.
const unavailable = async () => ({
  data: null,
  error: new Error("The studio service is temporarily unavailable."),
});
class UnavailableQuery {
  private writing = false;
  private singleRow = false;
  select() {
    return this;
  }
  eq() {
    return this;
  }
  neq() {
    return this;
  }
  is() {
    return this;
  }
  in() {
    return this;
  }
  gte() {
    return this;
  }
  lte() {
    return this;
  }
  gt() {
    return this;
  }
  lt() {
    return this;
  }
  ilike() {
    return this;
  }
  or() {
    return this;
  }
  not() {
    return this;
  }
  order() {
    return this;
  }
  limit() {
    return this;
  }
  range() {
    return this;
  }
  maybeSingle() {
    this.singleRow = true;
    return this;
  }
  single() {
    return this.maybeSingle();
  }
  insert() {
    this.writing = true;
    return this;
  }
  upsert() {
    return this.insert();
  }
  update() {
    return this.insert();
  }
  delete() {
    return this.insert();
  }
  then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
    const result = this.writing
      ? unavailable()
      : Promise.resolve({ data: this.singleRow ? null : [], error: null, count: 0 });
    return result.then(resolve, reject);
  }
}
export const demoClient = {
  from: () => new UnavailableQuery(),
  rpc: unavailable,
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    signInWithPassword: unavailable,
    signUp: unavailable,
    resetPasswordForEmail: unavailable,
    updateUser: unavailable,
    signInWithOAuth: unavailable,
  },
  functions: { invoke: unavailable },
  storage: {
    from: () => ({
      upload: unavailable,
      remove: unavailable,
      list: unavailable,
      createSignedUrl: unavailable,
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
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
