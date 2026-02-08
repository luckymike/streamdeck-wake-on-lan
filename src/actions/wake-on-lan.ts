/// <reference types="node" />
import streamDeck, { action, type DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import Logger from "@elgato/streamdeck";

import broadcastAddress from "broadcast-address";
import dgram from "dgram";
import { networkInterfaces } from 'os';

const logger = streamDeck.logger.createScope("WakeOnLan");

@action({ UUID: "dev.luckymike.wake-on-lan.wake" })
export class WakeOnLan extends SingletonAction<WakeOnLanSettings> {

    onWillAppear(ev: WillAppearEvent<WakeOnLanSettings>): void | Promise<void> {
    logger.trace("Started");
    let settings = ev.action.getSettings();
		return ev.action.setTitle(`${ev.payload.settings.name ?? "WoL"}`);
	}

	async onKeyDown(ev: KeyDownEvent<WakeOnLanSettings>): Promise<void> {
    const socket = dgram.createSocket('udp4');
    const udpWolPort = 9;
    let settings = await ev.action.getSettings();
    let mac = settings.macAddress;
    let ip = settings.broadcastIp ?? getBroadcastIp();
    let packet = magicPacketFromMac(mac);

    sendWolPacket(packet, ip);
		await ev.action.setTitle(`${settings.name}`);
	}
}

type WakeOnLanSettings = {
	name: string;
  macAddress: string;
  broadcastIp: string;
};

function getBroadcastIp(): String {
  const interfaces = networkInterfaces();
  let eths = Object.keys(interfaces).filter((iface) => iface.includes("en"));
  let broadcast = broadcastAddress(eths[0]);
  return broadcast;
};

function magicPacketFromMac(mac: string): any {
  // Convert MAC string to byte array
  let macBytes = mac.split(':').map(function(hex: string) {
    return parseInt(hex, 16);
  });

  // Create the magic packet: 6xFF + 16 * MAC
  let payload = Buffer.alloc(6 + 16 * 6, 0xff);
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 6; j++) {
      payload[6 + i * 6 + j] = macBytes[j];
    }
  }
  return payload
};

function sendWolPacket(packet, ip): void {
  const socket = dgram.createSocket('udp4');
  const udpWolPort = 9;

  socket.bind(() => {
    socket.setBroadcast(true);
      socket.send(packet, udpWolPort, ip, (err) => {
        if (err) {
          logger.error('Error sending WoL packet:', err);
        } else {
          logger.info('Wake-on-LAN magic packet sent!');
        }
        socket.close();
    });
  });
};
