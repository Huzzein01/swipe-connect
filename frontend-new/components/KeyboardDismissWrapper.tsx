import React from 'react';
import {
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';

type KeyboardDismissWrapperProps = {
  children: React.ReactNode;
};

const KeyboardDismissWrapper = ({ children }: KeyboardDismissWrapperProps) => {
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  );
};

export default KeyboardDismissWrapper;
