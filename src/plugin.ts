import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { WakeOnLan } from "./actions/wake-on-lan";

streamDeck.logger.setLevel(LogLevel.ERROR);

// Register the increment action.
streamDeck.actions.registerAction(new WakeOnLan());

// Finally, connect to the Stream Deck.
streamDeck.connect();
