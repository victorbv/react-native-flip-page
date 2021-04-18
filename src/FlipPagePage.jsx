import React from 'react';
import PropTypes from 'prop-types';
import {
  View, ViewPropTypes,
} from 'react-native';

class FlipPagePage extends React.PureComponent {
  render() {
    const { children, style } = this.props;
    const defaultStyle = {
      backgroundColor: '#fff',
      height: '100%',
      width: '100%',
    };
    const finalStyle = { ...defaultStyle, ...style };

    return (
      <View style={finalStyle}>
        {children}
      </View>
    );
  }
};

FlipPagePage.propTypes = {
  children: PropTypes.node,
  style: ViewPropTypes.style,
};

FlipPagePage.defaultProps = {
  children: <></>,
  style: {},
};

export default FlipPagePage;
