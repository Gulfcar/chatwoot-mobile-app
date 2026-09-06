import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, I18nManager, Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BottomSheetHeader } from '@/components-next';
import { Sheet, type SheetRef } from '@/components-next/common/sheet/Sheet';
import { tailwind } from '@/theme';

export type ContactableInbox = {
  id: number;
  name: string;
  sourceId: string;
  channelType?: string;
  phoneNumber?: string;
  email?: string;
};

type ContactableInboxSelectorSheetProps = {
  visible: boolean;
  inboxes: ContactableInbox[];
  isLoading?: boolean;
  onSelect: (inbox: ContactableInbox) => void;
  onClose: () => void;
};

export const ContactableInboxSelectorSheet = ({
  visible,
  inboxes,
  isLoading = false,
  onSelect,
  onClose,
}: ContactableInboxSelectorSheetProps) => {
  const sheetRef = useRef<SheetRef>(null);

  const sortedInboxes = useMemo(
    () => [...inboxes].sort((current, next) => current.name.localeCompare(next.name)),
    [inboxes],
  );

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const title = I18nManager.isRTL ? 'اختر صندوق الوارد' : 'Choose inbox';
  const empty = I18nManager.isRTL
    ? 'لا توجد قناة متاحة لبدء محادثة مع جهة الاتصال.'
    : 'No inbox is available to start a conversation with this contact.';

  return (
    <Sheet ref={sheetRef} detents={[0.46]} scrollable onDismiss={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <BottomSheetHeader headerText={title} />
        <Animated.View style={tailwind.style('px-4 pt-2 pb-6')}>
          {isLoading ? (
            <View style={tailwind.style('items-center justify-center py-10')}>
              <ActivityIndicator />
            </View>
          ) : null}

          {!isLoading && !sortedInboxes.length ? (
            <View style={tailwind.style('rounded-xl border border-gray-100 p-4')}>
              <Animated.Text style={tailwind.style('text-sm font-inter-420-20 text-gray-700')}>
                {empty}
              </Animated.Text>
            </View>
          ) : null}

          {!isLoading &&
            sortedInboxes.map(inbox => {
              const subtitle = inbox.phoneNumber || inbox.email || inbox.channelType || '';
              return (
                <Pressable
                  key={`${inbox.id}-${inbox.sourceId}`}
                  accessibilityRole="button"
                  onPress={() => onSelect(inbox)}
                  style={({ pressed }) =>
                    tailwind.style(
                      'rounded-xl border border-gray-100 px-4 py-3 mb-2',
                      pressed ? 'bg-gray-50' : 'bg-white',
                    )
                  }>
                  <Animated.Text
                    style={tailwind.style('text-base font-inter-medium-24 text-gray-950')}>
                    {inbox.name}
                  </Animated.Text>
                  {!!subtitle && (
                    <Animated.Text
                      style={tailwind.style('pt-1 text-xs font-inter-420-20 text-gray-700')}>
                      {subtitle.replace('Channel::', '')}
                    </Animated.Text>
                  )}
                </Pressable>
              );
            })}
        </Animated.View>
      </ScrollView>
    </Sheet>
  );
};
