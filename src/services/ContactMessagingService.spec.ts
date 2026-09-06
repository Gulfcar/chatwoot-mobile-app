import { ContactMessagingService } from './ContactMessagingService';
import { apiService } from '@/services/APIService';

jest.mock('@/services/APIService', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('ContactMessagingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads contacts from the contacts endpoint', async () => {
    (apiService.get as jest.Mock).mockResolvedValueOnce({
      data: {
        payload: [
          {
            id: 1,
            name: 'Ahmed',
            phone_number: '+966500000001',
            additional_attributes: {},
            custom_attributes: {},
          },
        ],
      },
    });

    const contacts = await ContactMessagingService.getContacts();

    expect(apiService.get).toHaveBeenCalledWith('contacts', {
      params: { page: 1, sort: '-created_at', include_contact_inboxes: false },
    });
    expect(contacts[0]).toMatchObject({
      id: 1,
      name: 'Ahmed',
      phoneNumber: '+966500000001',
    });
  });

  it('searches contacts on the existing global-search endpoint', async () => {
    (apiService.get as jest.Mock).mockResolvedValueOnce({
      data: {
        payload: {
          contacts: [
            {
              id: 2,
              name: 'Sara',
              phone_number: '+966500000002',
              additional_attributes: {},
              custom_attributes: {},
            },
          ],
        },
      },
    });

    const contacts = await ContactMessagingService.getContacts(' Sara ');

    expect(apiService.get).toHaveBeenCalledWith('search/contacts', {
      params: { q: 'Sara', page: 1 },
    });
    expect(contacts[0]).toMatchObject({
      id: 2,
      name: 'Sara',
      phoneNumber: '+966500000002',
    });
  });

  it('loads and normalizes contactable inboxes', async () => {
    (apiService.get as jest.Mock).mockResolvedValueOnce({
      data: {
        payload: [
          {
            inbox: {
              id: 10,
              name: 'WhatsApp Gulf Car',
              channel_type: 'Channel::Whatsapp',
              phone_number: '+966500000000',
            },
            source_id: '+966500000001',
          },
        ],
      },
    });

    const inboxes = await ContactMessagingService.getContactableInboxes(1);

    expect(apiService.get).toHaveBeenCalledWith('contacts/1/contactable_inboxes');
    expect(inboxes[0]).toMatchObject({
      id: 10,
      name: 'WhatsApp Gulf Car',
      channelType: 'Channel::Whatsapp',
      sourceId: '+966500000001',
    });
  });

  it('creates a conversation and returns the normalized conversation', async () => {
    (apiService.post as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          id: 314,
          unread_count: 0,
          messages: [],
        },
      },
    });

    const conversation = await ContactMessagingService.createConversation({
      contactId: 1,
      inbox: {
        id: 10,
        name: 'WhatsApp Gulf Car',
        sourceId: '+966500000001',
      },
      assigneeId: 42,
    });

    expect(apiService.post).toHaveBeenCalledWith('conversations', {
      contact_id: 1,
      inbox_id: 10,
      source_id: '+966500000001',
      assignee_id: 42,
    });
    expect(conversation.id).toBe(314);
  });

  it('fails safely when the server does not return a conversation id', async () => {
    (apiService.post as jest.Mock).mockResolvedValueOnce({
      data: { data: { messages: [] } },
    });

    await expect(
      ContactMessagingService.createConversation({
        contactId: 1,
        inbox: {
          id: 10,
          name: 'WhatsApp Gulf Car',
          sourceId: '+966500000001',
        },
      }),
    ).rejects.toThrow('Conversation was created without an id');
  });
});
