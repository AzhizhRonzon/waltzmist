export interface Match {
  id: string;
  name: string;
  photo: string;
  batch: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unread?: number;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: "sent" | "read";
}

export const MOCK_MATCHES: Match[] = [
  {
    id: "m1",
    name: "Ananya",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    batch: "PGP25",
    lastMessage: "See you at the Waltz? 🌸",
    lastMessageTime: "2m ago",
    unread: 2,
    isOnline: true,
  },
  {
    id: "m2",
    name: "Priya",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    batch: "PGP25",
    lastMessage: "Your playlist is probably better than mine",
    lastMessageTime: "1h ago",
    unread: 0,
    isOnline: true,
  },
  {
    id: "m3",
    name: "Arjun",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    batch: "PGPEx",
    lastMessage: "",
    lastMessageTime: "",
    unread: 0,
    isOnline: false,
  },
];

export const MOCK_CONVERSATIONS: Record<string, ChatMessage[]> = {
  m1: [
    {
      id: "c1",
      senderId: "m1",
      text: "Hey! I saw your Maggi Metric was through the roof 😄",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: "read",
    },
    {
      id: "c2",
      senderId: "me",
      text: "Haha guilty as charged. 2 AM philosophy sessions are my thing",
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      status: "read",
    },
    {
      id: "c3",
      senderId: "m1",
      text: "Perfect. I need someone to debate whether Maggi is better with cheese or without",
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      status: "read",
    },
    {
      id: "c4",
      senderId: "me",
      text: "Without, obviously. Cheese is for pizzas, not Maggi 🍕",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      status: "read",
    },
    {
      id: "c5",
      senderId: "m1",
      text: "Okay that's controversial but I respect it",
      timestamp: new Date(Date.now() - 1000 * 60 * 3),
      status: "read",
    },
    {
      id: "c6",
      senderId: "m1",
      text: "See you at the Waltz? 🌸",
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
      status: "sent",
    },
  ],
  m2: [
    {
      id: "c7",
      senderId: "me",
      text: "I saw your red flag and I have to say… PowerPoint IS an art form",
      timestamp: new Date(Date.now() - 1000 * 60 * 90),
      status: "read",
    },
    {
      id: "c8",
      senderId: "m2",
      text: "FINALLY someone gets it! Custom animations, colour theory, the whole nine yards",
      timestamp: new Date(Date.now() - 1000 * 60 * 80),
      status: "read",
    },
    {
      id: "c9",
      senderId: "m2",
      text: "Your playlist is probably better than mine",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      status: "read",
    },
  ],
};
