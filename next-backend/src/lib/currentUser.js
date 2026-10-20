import { ObjectId } from "mongodb";
import { verifyJWT } from "./auth";
import { getClientPromise } from "./mongodb";

export async function getCurrentUser(request) {
  const session = verifyJWT(request);

  if (!session || !ObjectId.isValid(session.id)) {
    return null;
  }

  const client = await getClientPromise();
  const db = client.db(process.env.MONGODB_DB);

  const user = await db.collection("users").findOne(
    { _id: new ObjectId(session.id) },
    { projection: { password: 0 } },
  );

  return user;
}