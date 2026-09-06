import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  View,
} from 'react-native';
import { StackActions, useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components-next/common';
import { SearchBar } from '@/components-next/common/search';
import { TAB_BAR_HEIGHT } from '@/constants';
import { useAppDispatch } from '@/hooks';
import i18n from 'i18n';
import { apiService } from '@/services/APIService';
import { addContact, addContacts } from '@/store/contact/contactSlice';
import { tailwind } from '@/theme';
import type { Contact } from '@/types/Contact';
import { transformContact } from '@/utils/camelCaseKeys';

type ContactsResponse = {
  payload?: Contact[] | { contacts?: Contact[] };
};

const normalizeContacts = (response: ContactsResponse): Contact[] => {
  if (Array.isArray(response.payload)) {
    return response.payload.map(transformContact);
  }

  return (response.payload?.contacts || []).map(transformContact);
};

const getSubtitle = (contact: Contact) =>
  contact.phoneNumber || contact.email || contact.additionalAttributes?.companyName || '';

const ContactsScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadContacts = useCallback(
    async (searchQuery = '', refreshing = false) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setHasError(false);

      try {
        const trimmedQuery = searchQuery.trim();
        const response =
          trimmedQuery.length >= 2
            ? await apiService.get<ContactsResponse>('search/contacts', {
                params: { q: trimmedQuery, page: 1 },
              })
            : await apiService.get<ContactsResponse>('contacts', {
                params: { page: 1, sort: '-created_at', include_contact_inboxes: false },
              });

        const nextContacts = normalizeContacts(response.data);
        setContacts(nextContacts);
        dispatch(addContacts({ contacts: nextContacts }));
      } catch {
        setHasError(true);
        setContacts([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadContacts(query);
    }, query.trim().length ? 300 : 0);

    return () => clearTimeout(timeout);
  }, [loadContacts, query]);

  const openContact = useCallback(
    (contact: Contact) => {
      dispatch(addContact(contact));
      navigation.dispatch(StackActions.push('ContactDetails', { contactId: contact.id }));
    },
    [dispatch, navigation],
  );

  const emptyText = useMemo(() => {
    if (hasError) {
      return i18n.t('SEARCH.ERROR_GENERIC');
    }
    if (query.trim().length >= 2) {
      return i18n.t('SEARCH.NO_RESULTS', {
        sectionLabel: i18n.t('SEARCH.SECTIONS.CONTACTS'),
        searchQuery: query.trim(),
      });
    }
    return i18n.t('SEARCH.SECTIONS.CONTACTS');
  }, [hasError, query]);

  return (
    <SafeAreaView edges={['top']} style={tailwind.style('flex-1 bg-white')}>
      <StatusBar translucent backgroundColor={tailwind.color('bg-white')} barStyle="dark-content" />

      <View style={tailwind.style('px-4 pt-3 pb-4 border-b border-blackA-A3')}>
        <Animated.Text
          style={tailwind.style('text-[22px] font-inter-medium-24 text-gray-950 pb-4')}>
          {i18n.t('SEARCH.SECTIONS.CONTACTS')}
        </Animated.Text>
        <SearchBar
          placeholder={i18n.t('SEARCH.PLACEHOLDER')}
          value={query}
          onChangeText={setQuery}
          isLoading={isLoading}
          onClear={() => setQuery('')}
        />
      </View>

      <FlatList
        data={contacts}
        keyExtractor={item => item.id.toString()}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadContacts(query, true)}
            tintColor={tailwind.color('text-gray-950')}
          />
        }
        contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT + 24}px]`)}
        renderItem={({ item }) => {
          const name = item.name || item.phoneNumber || item.email || `#${item.id}`;
          const subtitle = getSubtitle(item);

          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => openContact(item)}
              style={({ pressed }) =>
                tailwind.style(
                  'flex-row items-center px-4 py-3 border-b border-blackA-A3',
                  pressed ? 'bg-gray-50' : '',
                )
              }>
              <Avatar
                name={name}
                src={item.thumbnail ? { uri: item.thumbnail } : undefined}
                size="md"
              />
              <View style={tailwind.style('ml-3 flex-1')}>
                <Animated.Text
                  numberOfLines={1}
                  style={tailwind.style('text-base font-inter-medium-24 text-gray-950')}>
                  {name}
                </Animated.Text>
                {!!subtitle && subtitle !== name && (
                  <Animated.Text
                    numberOfLines={1}
                    style={tailwind.style('pt-1 text-sm font-inter-420-20 text-gray-700')}>
                    {subtitle}
                  </Animated.Text>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={tailwind.style('items-center justify-center px-8 pt-20')}>
            {isLoading ? (
              <ActivityIndicator color={tailwind.color('text-gray-950')} />
            ) : (
              <Animated.Text
                style={tailwind.style('text-sm font-inter-420-20 text-gray-700 text-center')}>
                {emptyText}
              </Animated.Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default ContactsScreen;
