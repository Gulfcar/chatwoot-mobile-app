import { apiService } from '@/services/APIService';
import type { Contact } from '@/types/Contact';
import type { Conversation } from '@/types/Conversation';
import { transformContact, transformConversation, transformInbox } from '@/utils/camelCaseKeys';

export type ContactableInbox = {
  id: number;
  name: string;
  sourceId: string;
  channelType?: string;
  phoneNumber?: string;
  email?: string;
};

type ContactsAPIResponse = {
  payload?: Record<string, unknown>[] | { contacts?: Record<string, unknown>[] };
};

type ContactableInboxAPIResponse = {
  payload?: {
    inbox: Record<string, unknown>;
    source_id?: string;
    sourceId?: string;
  }[];
};

type CreateConversationResponse = {
  data?: Record<string, unknown>;
  id?: number;
  [key: string]: unknown;
};

type CreateConversationPayload = {
  contactId: number;
  inbox: ContactableInbox;
  assigneeId?: number;
};

const normalizeContacts = (response: ContactsAPIResponse): Contact[] => {
  if (Array.isArray(response.payload)) {
    return response.payload.map(transformContact);
  }

  return (response.payload?.contacts || []).map(transformContact);
};

export class ContactMessagingService {
  static async getContacts(searchQuery = '', page = 1): Promise<Contact[]> {
    const trimmedQuery = searchQuery.trim();
    const response =
      trimmedQuery.length >= 2
        ? await apiService.get<ContactsAPIResponse>('search/contacts', {
            params: { q: trimmedQuery, page },
          })
        : await apiService.get<ContactsAPIResponse>('contacts', {
            params: { page, sort: '-created_at', include_contact_inboxes: false },
          });

    return normalizeContacts(response.data);
  }

  static async getContactableInboxes(contactId: number): Promise<ContactableInbox[]> {
    const response = await apiService.get<ContactableInboxAPIResponse>(
      `contacts/${contactId}/contactable_inboxes`,
    );

    return (response.data.payload || []).map(entry => {
      const inbox = transformInbox(entry.inbox) as unknown as ContactableInbox;
      return {
        ...inbox,
        sourceId: entry.source_id || entry.sourceId || '',
      };
    });
  }

  static async createConversation({
    contactId,
    inbox,
    assigneeId,
  }: CreateConversationPayload): Promise<Conversation> {
    const response = await apiService.post<CreateConversationResponse>('conversations', {
      contact_id: contactId,
      inbox_id: inbox.id,
      source_id: inbox.sourceId,
      ...(assigneeId ? { assignee_id: assigneeId } : {}),
    });
    const rawConversation = response.data?.data || response.data;
    const conversation = transformConversation(rawConversation);

    if (!conversation.id) {
      throw new Error('Conversation was created without an id');
    }

    return conversation;
  }
}
