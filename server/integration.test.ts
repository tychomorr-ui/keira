import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user context
function createMockContext(userId: number = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `Test User ${userId}`,
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Knowledge Graph Integration Tests", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("Fact Management", () => {
    it("should add and retrieve facts", async () => {
      const addResult = await caller.kg.addFact({
        subject: "Alice",
        predicate: "knows",
        object: "Bob",
      });

      expect(addResult).toBeDefined();

      const facts = await caller.kg.getFacts({});
      expect(facts.length).toBeGreaterThan(0);
      expect(facts.some(f => f.subject === "Alice" && f.predicate === "knows" && f.object === "Bob")).toBe(true);
    });

    it("should filter facts by subject", async () => {
      await caller.kg.addFact({
        subject: "Alice",
        predicate: "knows",
        object: "Bob",
      });

      await caller.kg.addFact({
        subject: "Charlie",
        predicate: "knows",
        object: "David",
      });

      const aliceFacts = await caller.kg.getFacts({ subject: "Alice" });
      expect(aliceFacts.every(f => f.subject === "Alice")).toBe(true);
    });

    it("should remove facts", async () => {
      await caller.kg.addFact({
        subject: "Alice",
        predicate: "knows",
        object: "Bob",
      });

      const removeResult = await caller.kg.removeFact({
        subject: "Alice",
        predicate: "knows",
        object: "Bob",
      });

      expect(removeResult).toBeDefined();

      const facts = await caller.kg.getFacts({ subject: "Alice" });
      expect(facts.some(f => f.object === "Bob")).toBe(false);
    });
  });

  describe("Ontology Management", () => {
    it("should define classes", async () => {
      const result = await caller.kg.defineClass({
        className: "Person",
      });

      expect(result).toBeDefined();

      const classes = await caller.kg.getClasses();
      expect(classes.some(c => c.className === "Person")).toBe(true);
    });

    it("should define class hierarchy", async () => {
      await caller.kg.defineClass({ className: "Animal" });
      await caller.kg.defineClass({
        className: "Dog",
        parentClassName: "Animal",
      });

      const classes = await caller.kg.getClasses();
      const dogClass = classes.find(c => c.className === "Dog");
      expect(dogClass?.parentClassName).toBe("Animal");
    });

    it("should define properties", async () => {
      const result = await caller.kg.defineProperty({
        propertyName: "age",
        domain: "Person",
        range: "Integer",
      });

      expect(result).toBeDefined();

      const properties = await caller.kg.getProperties();
      expect(properties.some(p => p.propertyName === "age")).toBe(true);
    });
  });

  describe("Semantic Indexing", () => {
    it("should associate instances with classes", async () => {
      await caller.kg.defineClass({ className: "Person" });

      const result = await caller.kg.associateInstance({
        instanceName: "Alice",
        className: "Person",
      });

      expect(result).toBeDefined();

      const types = await caller.kg.getEntityTypes({ instanceName: "Alice" });
      expect(types.includes("Person")).toBe(true);
    });

    it("should retrieve entity types", async () => {
      await caller.kg.defineClass({ className: "Person" });
      await caller.kg.associateInstance({
        instanceName: "Bob",
        className: "Person",
      });

      const types = await caller.kg.getEntityTypes({ instanceName: "Bob" });
      expect(types.length).toBeGreaterThan(0);
      expect(types[0]).toBe("Person");
    });
  });

  describe("Query Interface", () => {
    beforeEach(async () => {
      await caller.kg.addFact({
        subject: "Alice",
        predicate: "knows",
        object: "Bob",
      });
      await caller.kg.addFact({
        subject: "Bob",
        predicate: "knows",
        object: "Charlie",
      });
    });

    it("should execute 'get facts where' queries", async () => {
      const result = await caller.kg.executeQuery({
        query: 'get facts where subject is "Alice"',
      });

      expect(result.type).toBe("facts");
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].subject).toBe("Alice");
    });

    it("should execute 'get types of' queries", async () => {
      await caller.kg.defineClass({ className: "Person" });
      await caller.kg.associateInstance({
        instanceName: "Alice",
        className: "Person",
      });

      const result = await caller.kg.executeQuery({
        query: 'get types of "Alice"',
      });

      expect(result.type).toBe("types");
      expect(result.data.length).toBeGreaterThan(0);
    });

    it("should return error for invalid queries", async () => {
      const result = await caller.kg.executeQuery({
        query: "invalid query format",
      });

      expect(result.type).toBe("error");
    });
  });

  describe("Inference Engine", () => {
    beforeEach(async () => {
      await caller.kg.addFact({
        subject: "Alice",
        predicate: "knows",
        object: "Bob",
      });
      await caller.kg.addFact({
        subject: "Bob",
        predicate: "knows",
        object: "Charlie",
      });
    });

    it("should detect direct transitive relationships", async () => {
      const result = await caller.kg.checkTransitiveProperty({
        entity1: "Alice",
        property: "knows",
        entity2: "Bob",
      });

      expect(result.result).toBe(true);
      expect(result.path).toEqual(["Alice", "Bob"]);
    });

    it("should detect 2-hop transitive relationships", async () => {
      const result = await caller.kg.checkTransitiveProperty({
        entity1: "Alice",
        property: "knows",
        entity2: "Charlie",
      });

      expect(result.result).toBe(true);
      expect(result.path).toEqual(["Alice", "Bob", "Charlie"]);
    });

    it("should return false for non-existent paths", async () => {
      const result = await caller.kg.checkTransitiveProperty({
        entity1: "Alice",
        property: "knows",
        entity2: "David",
      });

      expect(result.result).toBe(false);
      expect(result.path).toBeNull();
    });

    it("should check direct subclass relationships", async () => {
      await caller.kg.defineClass({ className: "Animal" });
      await caller.kg.defineClass({
        className: "Dog",
        parentClassName: "Animal",
      });

      const result = await caller.kg.checkSubclass({
        className: "Dog",
        parentClassName: "Animal",
      });

      expect(result.result).toBe(true);
    });
  });
});
