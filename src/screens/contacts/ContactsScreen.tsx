import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useAppDispatch, useAppSelector } from '@/hooks';
import i18n from 'i18n';
import { ContactMessagingService } from '@/services/ContactMessagingService';
import { addContact, addContacts } from '@/store/contact/contactSlice';
import { selectUser } from '@/store/auth/authSelectors';
import { maskContactName, maskPhoneNumber, shouldMaskContactNumbers } from '@/utils/privacyUtils';
import { tailwind } from '@/theme';
import type { Contact } from '@/types/Contact';

const getSubtitle = (contact: Contact, maskNumbers: boolean) => {
  if (contact.phoneNumber) {
    return maskNumbers ? maskPhoneNumber(contact.phoneNumber) : contact.phoneNumber;
  }

  return contact.email || contact.additionalAttributes?.companyName || '';
};

const ContactsScreen = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const maskNumbers = shouldMaskContactNumbers(user, user?.account_id ?? null);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Guards against a second page request while one is already in flight; state
  // updates are async and onEndReached can fire several times per scroll.
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const loadContacts = useCallback(
    async (searchQuery = '', refreshing = false) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setHasError(false);
      isFetchingRef.current = true;

      try {
        const nextContacts = await ContactMessagingService.getContacts(searchQuery, 1);
        pageRef.current = 1;
        setHasMore(nextContacts.length > 0);
        setContacts(nextContacts);
        dispatch(addContacts({ contacts: nextContacts }));
      } catch {
        setHasError(true);
        setContacts([]);
        setHasMore(false);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [dispatch],
  );

  const loadMoreContacts = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || hasError) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = pageRef.current + 1;

    try {
      const nextContacts = await ContactMessagingService.getContacts(query, nextPage);

      if (!nextContacts.length) {
        setHasMore(false);
        return;
      }

      pageRef.current = nextPage;
      setContacts(current => {
        const seen = new Set(current.map(contact => contact.id));
        const unseen = nextContacts.filter(contact => !seen.has(contact.id));
        return unseen.length ? [...current, ...unseen] : current;
      });
      dispatch(addContacts({ contacts: nextContacts }));
    } catch {
      // Keep the pages already loaded; the next scroll can retry.
      setHasMore(false);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [dispatch, hasError, hasMore, query]);

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        loadContacts(query);
      },
      query.trim().length ? 300 : 0,
    );

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
        onEndReached={loadMoreContacts}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={tailwind.style('py-6')}>
              <ActivityIndicator color={tailwind.color('text-gray-950')} />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          // A nameless contact falls back to its number, and Chatwoot also
          // stores the number as the name, so both paths go through the mask.
          const fallbackNumber = maskNumbers ? maskPhoneNumber(item.phoneNumber) : item.phoneNumber;
          const name =
            maskContactName(item.name, maskNumbers) ||
            fallbackNumber ||
            item.email ||
            `#${item.id}`;
          const subtitle = getSubtitle(item, maskNumbers);

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
