import { createConsumer } from '@rails/actioncable';
import type {
  Channel,
  CreateMixin,
  Consumer,
  Subscription
} from '@rails/actioncable';

type CableParams = Record<string, unknown>;
type CableCallbacks = Partial<Channel>;

let consumer: Consumer | null = null;
let consumerToken: string | null = null;

export const ensureConsumer = (token: string) => {
  if (consumer && consumerToken === token) {
    return consumer;
  }

  if (consumer) {
    consumer.disconnect();
  }

  consumerToken = token;
  consumer = createConsumer(buildCableUrl(token));
  return consumer;
};

export const disconnectConsumer = () => {
  if (consumer) {
    consumer.disconnect();
    consumer = null;
    consumerToken = null;
  }
};

export const subscribeToChannel = (
  token: string,
  params: CableParams & { channel: string },
  callbacks: CableCallbacks = {}
): Subscription => {
  const currentConsumer = ensureConsumer(token);
  return currentConsumer.subscriptions.create(params as CreateMixin, callbacks);
};

function buildCableUrl(token: string) {
  const base =
    import.meta.env.VITE_CABLE_URL ||
    deriveCableUrlFromWindow() ||
    'ws://localhost:3000/cable';

  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}

function deriveCableUrlFromWindow() {
  if (typeof window === 'undefined') return null;

  const { protocol, hostname } = window.location;
  const cableProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  const port = import.meta.env.VITE_BACKEND_PORT || '3000';

  return `${cableProtocol}//${hostname}:${port}/cable`;
}

