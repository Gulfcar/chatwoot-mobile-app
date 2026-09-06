import React, { useState } from 'react';
import { Dimensions, I18nManager, Linking, Pressable } from 'react-native';
import { StackActions, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Animated from 'react-native-reanimated';

import { Icon } from '@/components-next';
import { useAppSelector } from '@/hooks';
import type { TabBarExcludedScreenParamList } from '@/navigation/tabs/AppTabs';
import { ContactableInboxSelectorSheet } from '@/screens/common/ContactableInboxSelectorSheet';
import {
  ContactMessagingService,
  type ContactableInbox,
} from '@/services/ContactMessagingService';
import { selectUserId } from '@/store/auth/authSelectors';
import { ChatIcon, MailIcon, PhoneIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { useHaptic, useScaleAnimation } from '@/utils';
import { openNumber, openEmail } from '@/utils/urlUtils';
import { showToast } from '@/utils/toastUtils';
import i18n from '@/i18n';

type ContactOption = {
  contactType: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

type ContactOptionProps = {
  option: ContactOption;
  handleOptionPress?: () => void;
};

const SCREEN_WIDTH = Dimensions.get('screen').width;
const OPTION_WIDTH = (SCREEN_WIDTH - 32 - 12 * 2) / 3;

const ContactOptionComponent = (props: ContactOptionProps) => {
  const { option, handleOptionPress } = props;

  const { handlers, animatedStyle } = useScaleAnimation();
  const hapticSelection = useHaptic();

  const handleOnPress = () => {
    if (option.disabled) {
      return;
    }
    hapticSelection?.();
    handleOptionPress?.();
  };

  return (
    <Animated.View style={[tailwind.style('flex-1'), animatedStyle]}>
      <Pressable
        style={({ pressed }) => [
          tailwind.style(
            'flex items-center justify-center flex-1 rounded-xl bg-gray-50 py-3',
            `w-[${OPTION_WIDTH}px]`,
            pressed && !option.disabled ? 'bg-gray-100' : '',
            option.disabled ? 'opacity-50' : '',
          ),
        ]}
        disabled={option.disabled}
        onPress={handleOnPress}
        {...handlers}>
        <Icon icon={option.icon} size={24} />
        <Animated.Text
          numberOfLines={1}
          style={tailwind.style(
            'text-cxs font-inter-medium-24 leading-[15px] tracking-[0.32px] text-center text-blue-800 pt-2',
          )}>
          {option.contactType}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
};

type ContactBasicActionsProps = {
  phoneNumber?: string;
  email?: string;
};

export const ContactBasicActions = (props: ContactBasicActionsProps) => {
  const { phoneNumber, email } = props;
  const navigation = useNavigation();
  const route = useRoute<RouteProp<TabBarExcludedScreenParamList, 'ContactDetails'>>();
  const currentUserId = useAppSelector(selectUserId);
  const contactId = route.params?.contactId;
  const conversationId = route.params?.conversationId;
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [isLoadingInboxes, setIsLoadingInboxes] = useState(false);
  const [contactableInboxes, setContactableInboxes] = useState<ContactableInbox[]>([]);

  const onCallPress = () => {
    openNumber({ phoneNumber });
  };

  const onEmailPress = () => {
    openEmail({ email });
  };

  const openSystemSms = () => {
    if (phoneNumber) {
      Linking.openURL(`sms:${phoneNumber}`);
    }
  };

  const openChatScreen = (targetConversationId: number) => {
    navigation.dispatch(
      StackActions.replace('ChatScreen', {
        conversationId: targetConversationId,
      }),
    );
  };

  const createConversation = async (inbox: ContactableInbox) => {
    if (!contactId) {
      openSystemSms();
      return;
    }

    try {
      const conversation = await ContactMessagingService.createConversation({
        contactId,
        inbox,
        assigneeId: currentUserId,
      });
      setSelectorVisible(false);
      openChatScreen(conversation.id);
    } catch {
      showToast({
        message: I18nManager.isRTL
          ? 'تعذر بدء المحادثة. حاول مرة أخرى.'
          : 'Unable to start the conversation. Please try again.',
      });
    }
  };

  const onMessagePress = async () => {
    if (conversationId) {
      openChatScreen(conversationId);
      return;
    }

    if (!contactId) {
      openSystemSms();
      return;
    }

    setSelectorVisible(true);
    setIsLoadingInboxes(true);
    setContactableInboxes([]);

    try {
      const inboxes = (await ContactMessagingService.getContactableInboxes(contactId)).filter(
        inbox => inbox.sourceId && inbox.channelType !== 'Channel::Email',
      );

      if (!inboxes.length) {
        setSelectorVisible(false);
        showToast({
          message: I18nManager.isRTL
            ? 'لا توجد قناة متاحة لبدء رسالة مع جهة الاتصال.'
            : 'No inbox is available to message this contact.',
        });
        return;
      }

      if (inboxes.length === 1) {
        setSelectorVisible(false);
        await createConversation(inboxes[0]);
        return;
      }

      setContactableInboxes(inboxes);
    } catch {
      setSelectorVisible(false);
      showToast({
        message: I18nManager.isRTL
          ? 'تعذر تحميل قنوات التواصل.'
          : 'Unable to load contactable inboxes.',
      });
    } finally {
      setIsLoadingInboxes(false);
    }
  };

  if (!email && !phoneNumber && !conversationId && !contactId) {
    return null;
  }

  const messageLabel = I18nManager.isRTL ? 'رسالة' : 'Message';
  const messageEnabled = !!conversationId || !!contactId || !!phoneNumber;

  return (
    <>
      <Animated.View style={tailwind.style('flex flex-row justify-between gap-3')}>
        <ContactOptionComponent
          key="call"
          option={{
            contactType: i18n.t('CONTACT_DETAILS.CALL'),
            icon: <PhoneIcon strokeWidth={2} stroke={tailwind.color('bg-blue-800')} />,
            disabled: !phoneNumber,
          }}
          handleOptionPress={onCallPress}
        />
        <ContactOptionComponent
          key="message"
          option={{
            contactType: messageLabel,
            icon: <ChatIcon strokeWidth={2} stroke={tailwind.color('bg-blue-800')} />,
            disabled: !messageEnabled,
          }}
          handleOptionPress={onMessagePress}
        />
        <ContactOptionComponent
          key="email"
          option={{
            contactType: i18n.t('CONTACT_DETAILS.EMAIL'),
            icon: <MailIcon strokeWidth={2} stroke={tailwind.color('bg-blue-800')} />,
            disabled: !email,
          }}
          handleOptionPress={onEmailPress}
        />
      </Animated.View>

      <ContactableInboxSelectorSheet
        visible={selectorVisible}
        inboxes={contactableInboxes}
        isLoading={isLoadingInboxes}
        onSelect={createConversation}
        onClose={() => setSelectorVisible(false)}
      />
    </>
  );
};
