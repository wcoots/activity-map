import { createKysely } from "@vercel/postgres-kysely";

import { Schema } from "@/types/schema";

export const db = createKysely<Schema>();
