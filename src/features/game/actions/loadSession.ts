import Decimal from "decimal.js-light";
import { CONFIG } from "lib/config";
import { GameState, InventoryItemName, Tree } from "../types/game";

type Request = {
  sessionId: string;
  farmId: number;
  token: string;
};

type Response = {
  game: GameState;
  offset: number;
};

const API_URL = CONFIG.API_URL;

export async function loadSession(
  request: Request
): Promise<Response | undefined> {
  if (!API_URL) return;

  console.log("calling /session");

  const response = await window.fetch(`${API_URL}/session`, {
    method: "POST",
    headers: {
      "content-type": "application/json;charset=UTF-8",
      Authorization: `Bearer ${request.token}`,
    },
    body: JSON.stringify({
      sessionId: request.sessionId,
      farmId: request.farmId,
    }),
  });

  const { farm, startedAt } = await response.json();

  const startedTime = new Date(startedAt);

  let offset = 0;
  // Clock is not in sync with actual UTC time
  if (Math.abs(startedTime.getTime() - Date.now()) > 1000 * 30) {
    console.log("Not in sync!", startedTime.getTime() - Date.now());
    offset = startedTime.getTime() - Date.now();
  }

  return {
    offset,
    game: {
      inventory: Object.keys(farm.inventory).reduce(
        (items, item) => ({
          ...items,
          [item]: new Decimal(farm.inventory[item]),
        }),
        {} as Record<InventoryItemName, Decimal>
      ),
      stock: Object.keys(farm.stock).reduce(
        (items, item) => ({
          ...items,
          [item]: new Decimal(farm.stock[item]),
        }),
        {} as Record<InventoryItemName, Decimal>
      ),
      trees: Object.keys(farm.trees).reduce(
        (items, item) => ({
          ...items,
          [item]: {
            ...farm.trees[item],
            wood: new Decimal(farm.trees[item].wood),
          },
        }),
        {} as Record<number, Tree>
      ),
      balance: new Decimal(farm.balance),
      fields: farm.fields,
      id: farm.id,
    },
  };
}
