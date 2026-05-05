import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, facts, ontologyClasses, ontologyProperties, semanticIndex, Fact, OntologyClass, OntologyProperty, SemanticIndexEntry } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Knowledge Graph Queries

export async function addFact(userId: number, subject: string, predicate: string, object: string): Promise<Fact | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.insert(facts).values({
      userId,
      subject,
      predicate,
      object,
    });
    const inserted = await db.select().from(facts).where(eq(facts.userId, userId)).orderBy(facts.id).limit(1);
    return inserted.length > 0 ? inserted[inserted.length - 1] : null;
  } catch (error) {
    console.error("[Database] Failed to add fact:", error);
    return null;
  }
}

export async function removeFact(userId: number, subject: string, predicate: string, object: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.delete(facts).where(
      and(
        eq(facts.userId, userId),
        eq(facts.subject, subject),
        eq(facts.predicate, predicate),
        eq(facts.object, object)
      )
    );
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove fact:", error);
    return false;
  }
}

export async function getFacts(userId: number, subject?: string, predicate?: string, object?: string): Promise<Fact[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const conditions = [eq(facts.userId, userId)];
    
    if (subject) {
      conditions.push(eq(facts.subject, subject));
    }
    if (predicate) {
      conditions.push(eq(facts.predicate, predicate));
    }
    if (object) {
      conditions.push(eq(facts.object, object));
    }
    
    return await db.select().from(facts).where(and(...conditions));
  } catch (error) {
    console.error("[Database] Failed to get facts:", error);
    return [];
  }
}

export async function defineClass(userId: number, className: string, parentClassName?: string): Promise<OntologyClass | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    await db.insert(ontologyClasses).values({
      userId,
      className,
      parentClassName: parentClassName || null,
    });
    const result = await db.select().from(ontologyClasses).where(
      and(eq(ontologyClasses.userId, userId), eq(ontologyClasses.className, className))
    ).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to define class:", error);
    return null;
  }
}

export async function getClasses(userId: number): Promise<OntologyClass[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(ontologyClasses).where(eq(ontologyClasses.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get classes:", error);
    return [];
  }
}

export async function defineProperty(userId: number, propertyName: string, domain?: string, range?: string): Promise<OntologyProperty | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    await db.insert(ontologyProperties).values({
      userId,
      propertyName,
      domain: domain || null,
      range: range || null,
    });
    const result = await db.select().from(ontologyProperties).where(
      and(eq(ontologyProperties.userId, userId), eq(ontologyProperties.propertyName, propertyName))
    ).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to define property:", error);
    return null;
  }
}

export async function getProperties(userId: number): Promise<OntologyProperty[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(ontologyProperties).where(eq(ontologyProperties.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get properties:", error);
    return [];
  }
}

export async function associateInstance(userId: number, instanceName: string, className: string): Promise<SemanticIndexEntry | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    await db.insert(semanticIndex).values({
      userId,
      instanceName,
      className,
    });
    const result = await db.select().from(semanticIndex).where(
      and(eq(semanticIndex.userId, userId), eq(semanticIndex.instanceName, instanceName), eq(semanticIndex.className, className))
    ).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to associate instance:", error);
    return null;
  }
}

export async function getEntityTypes(userId: number, instanceName: string): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const results = await db.select().from(semanticIndex).where(
      and(eq(semanticIndex.userId, userId), eq(semanticIndex.instanceName, instanceName))
    );
    return results.map(r => r.className);
  } catch (error) {
    console.error("[Database] Failed to get entity types:", error);
    return [];
  }
}

export async function removeClass(userId: number, className: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.delete(ontologyClasses).where(
      and(eq(ontologyClasses.userId, userId), eq(ontologyClasses.className, className))
    );
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove class:", error);
    return false;
  }
}

export async function removeProperty(userId: number, propertyName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.delete(ontologyProperties).where(
      and(eq(ontologyProperties.userId, userId), eq(ontologyProperties.propertyName, propertyName))
    );
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove property:", error);
    return false;
  }
}
