import React from 'react';
import {
  PanResponder, View,
} from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';
import { rotateX, rotateY, transformOrigin } from './transform-utils';
import renderVerticalPage from './vertical-page';
import renderHorizontalPage from './horizontal-page';

class FlipPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      angle: 0,
      page: 0,
      halfHeight: 0,
      halfWidth: 0,
      shouldGoNext: false,
      shouldGoPrevious: false,
      direction: '',
      isAnimating: false,
      isAutoTurning: false,
    };

    this.firstHalves = [];
    this.secondHalves = [];

    this.onLayout = this.onLayout.bind(this);
    this.renderPage = this.renderPage.bind(this);
  }

  UNSAFE_componentWillMount() {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) >= 1 && Math.abs(dy) >= 1;
      },
      onPanResponderMove: this.handlePanResponderMove.bind(this),
      onPanResponderRelease: this.handlePanResponderStop.bind(this),
      onPanResponderGrant: () => {
        const { onSwipeStart } = this.props;
        if (typeof onSwipeStart === 'function') {
          onSwipeStart();
        }
      },
    });
  }

  handlePanResponderMove(e, gestureState) {
    const { isAnimating, direction, angle: currentAngle } = this.state;
    if (isAnimating) return;

    const { dx, dy } = gestureState;
    const { orientation, loopForever, reverse } = this.props;
    const dn = orientation === 'vertical' ? dy : dx;

    let angle = (dn / 250) * 180;

    if (angle < 0) {
      angle = Math.max(-180, angle);
    } else {
      angle = Math.min(180, angle);
    }

    let nextDirection = direction;
    if (!reverse) {
      if (dn < 0 && direction === '') {
        nextDirection = orientation === 'vertical' ? 'top' : 'left';
      } else if (dn > 0 && direction === '') {
        nextDirection = orientation === 'vertical' ? 'bottom' : 'right';
      }
      if (dn < 0 && (nextDirection === 'top' || nextDirection === 'left')) {
        if (this.isOnLastPage() && !loopForever) {
          angle = Math.max(angle, -30);
        }
        this.rotateSecondHalf(angle);
      } else if (dn > 0 && (nextDirection === 'bottom' || nextDirection === 'right')) {
        if (this.isOnFirstPage() && !loopForever) {
          angle = Math.min(angle, 30);
        }
        this.rotateFirstHalf(angle);
      } else {
        angle = currentAngle;
      }
    } else {
      if (dn < 0 && direction === '') {
        nextDirection = orientation === 'vertical' ? 'top' : 'left';
      } else if (dn > 0 && direction === '') {
        nextDirection = orientation === 'vertical' ? 'bottom' : 'right';
      }
      if (dn < 0 && (nextDirection === 'top' || nextDirection === 'left')) {
        if (this.isOnFirstPage() && !loopForever) {
          angle = Math.max(angle, -30);
        }
        this.rotateSecondHalf(angle);
      } else if (dn > 0 && (nextDirection === 'bottom' || nextDirection === 'right')) {
        if (this.isOnLastPage() && !loopForever) {
          angle = Math.min(angle, 30);
        }
        this.rotateFirstHalf(angle);
      } else {
        angle = currentAngle;
      }
    }

    this.setState({
      direction: nextDirection,
      angle,
    });
  }

  handlePanResponderStop(_e, gestureState) {
    const {
      angle, page, direction, isAnimating,
    } = this.state;
    if (isAnimating) return;

    const { dx, dy } = gestureState;
    const { orientation, reverse, children } = this.props;
    const dn = orientation === 'vertical' ? dy : dx;
    const absAngle = Math.abs(angle);

    if (dn === 0) {
      const { onPress } = children[page].props;
      if (typeof onPress === 'function') {
        onPress();
      }
    }

    const shouldGoNext = (reverse)
      ? absAngle > 90 && (direction === 'top' || direction === 'right')
      : absAngle > 90 && (direction === 'top' || direction === 'left');

    const shouldGoPrevious = (reverse)
      ? absAngle > 90 && (direction === 'bottom' || direction === 'left')
      : absAngle > 90 && (direction === 'bottom' || direction === 'right');

    this.setState({
      isAnimating: true,
      shouldGoNext,
      shouldGoPrevious,
    }, this.resetHalves);
  }

  onLayout(e) {
    const { layout } = e.nativeEvent;
    const { width, height } = layout;
    const halfHeight = height / 2;
    const halfWidth = width / 2;

    this.setState({
      halfHeight,
      halfWidth,
    });
  }

  setCurrentPage(targetPage) {
    const { page } = this.state;
    const firstHalf = this.firstHalves[page];
    const secondHalf = this.secondHalves[page];
    this.setState({
      angle: 0,
      page: targetPage,
    }, () => {
      const direction = (targetPage > page) ? 'next' : 'prev';
      const { onPageChange, onSwipeStop } = this.props;
      onPageChange(targetPage, direction);
      firstHalf.setNativeProps({ transform: [] });
      secondHalf.setNativeProps({ transform: [] });
      if (typeof onSwipeStop === 'function') {
        onSwipeStop();
      }
    });
  }

  /* Public call to next page */
  goToNextPage() {
    const { isAnimating } = this.state;
    if (isAnimating || this.isOnLastPage()) return;

    const { onSwipeStart, orientation } = this.props;
    onSwipeStart();

    const angle = -11;
    this.rotateSecondHalf(angle);

    this.setState({
      angle,
      direction: orientation === 'vertical' ? 'top' : 'left',
      isAnimating: true,
      shouldGoNext: true,
      shouldGoPrevious: false,
      isAutoTurning: true,
    }, this.resetHalves);
  }

  /* Public call to previous page */
  goToPreviousPage() {
    const { isAnimating } = this.state;
    if (isAnimating || this.isOnFirstPage()) return;

    const { onSwipeStart, orientation } = this.props;
    onSwipeStart();

    const angle = 11;
    this.rotateFirstHalf(angle);

    this.setState({
      angle,
      direction: orientation === 'vertical' ? 'bottom' : 'right',
      isAnimating: true,
      shouldGoNext: false,
      shouldGoPrevious: true,
      isAutoTurning: true,
    }, this.resetHalves);
  }

  lastPage() {
    const { children } = this.props;
    return children.length - 1;
  }

  isOnFirstPage() {
    const { page } = this.state;
    return page === 0;
  }

  isOnLastPage() {
    const { page } = this.state;
    return page === this.lastPage();
  }

  rotateFirstHalf(angle) {
    const {
      halfHeight,
      halfWidth,
      page,
    } = this.state;
    const { orientation } = this.props;
    const firstHalf = this.firstHalves[page];

    const matrix = orientation === 'vertical' ? rotateX(angle) : rotateY(angle);
    const origin = orientation === 'vertical'
      ? { x: 0, y: halfHeight / 2, z: 0 }
      : { x: halfWidth / 2, y: 0, z: 0 };
    transformOrigin(matrix, origin);
    firstHalf.setNativeProps({
      transform: [
        { matrix },
        { perspective: 100000 },
      ],
    });
  }

  rotateSecondHalf(angle) {
    const {
      halfHeight,
      halfWidth,
      page,
    } = this.state;
    const { orientation } = this.props;
    const secondHalf = this.secondHalves[page];

    const matrix = orientation === 'vertical' ? rotateX(angle) : rotateY(angle);
    const origin = orientation === 'vertical'
      ? { x: 0, y: -halfHeight / 2, z: 0 }
      : { x: -halfWidth / 2, y: 0, z: 0 };
    transformOrigin(matrix, origin);
    secondHalf.setNativeProps({
      transform: [
        { matrix },
        { perspective: 100000 },
      ],
    });
  }

  resetHalves() {
    const { loopForever, children } = this.props;
    const pages = children.length;
    const {
      angle: currentAngle,
      direction,
      shouldGoNext,
      shouldGoPrevious,
      page,
      isAutoTurning,
    } = this.state;

    const finish = () => {
      const { direction: directionState } = this.state;
      this.setState({ direction: '', isAnimating: false, isAutoTurning: false });

      if (shouldGoNext) {
        this.setCurrentPage(loopForever && this.isOnLastPage() ? 0 : page + 1);
      } else if (shouldGoPrevious) {
        this.setCurrentPage(loopForever && this.isOnFirstPage() ? pages - 1 : page - 1);
      } else {
        const { onFinish, onSwipeStop } = this.props;
        if (typeof onSwipeStop === 'function') {
          onSwipeStop();
        }
        if (typeof onFinish === 'function') {
          onFinish(directionState);
        }
      }
    };

    // Already swiped all the way
    if (Math.abs(currentAngle) === 180) {
      finish();
      return;
    }

    let targetAngle;
    if (currentAngle < -90 || (isAutoTurning && shouldGoNext)) {
      targetAngle = -180;
    } else if (currentAngle > 90 || (isAutoTurning && shouldGoPrevious)) {
      targetAngle = 180;
    } else {
      targetAngle = 0;
    }

    this.resetTimer = setInterval(() => {
      let { angle } = this.state;
      const { isAutoTurning: autoTurning } = this.state;

      const da = autoTurning ? 10 : 15;

      angle += angle < targetAngle ? da : -da;

      if (angle < 0) {
        angle = Math.max(angle, -180);
      } else {
        angle = Math.min(angle, 180);
      }

      // let matrix = rotateX(angle);

      if (angle < 0) {
        this.rotateSecondHalf(angle);
      } else {
        this.rotateFirstHalf(angle);
      }

      this.setState({ angle });

      if (
        (targetAngle < 0 && angle <= targetAngle) // Flip second half to top
        || (targetAngle === 0 && Math.abs(angle) <= da)
        || (targetAngle > 0 && angle >= targetAngle) // Flip first half to bottom
      ) {
        clearInterval(this.resetTimer);

        if (direction === 'top' || direction === 'left' || direction === '') {
          this.rotateSecondHalf(targetAngle);
        } else if (direction === 'bottom' || direction === 'right' || direction === '') {
          this.rotateFirstHalf(targetAngle);
        }

        finish();
      }
    }, 30);
  }

  renderVerticalPage(previousPage, thisPage, nextPage, index) {
    const {
      angle,
      page,
      halfHeight,
      direction,
    } = this.state;

    const height = { height: halfHeight * 2 };

    const absAngle = Math.abs(angle);

    const secondHalfPull = {
      marginTop: -halfHeight,
    };

    return renderVerticalPage(
      absAngle,
      page,
      halfHeight,
      direction,
      height,
      secondHalfPull,
      styles,
      index,
      this,
      previousPage,
      thisPage,
      nextPage,
    );
  }

  renderHorizontalPage(previousPage, thisPage, nextPage, index) {
    const {
      angle,
      page,
      halfWidth,
      direction,
    } = this.state;

    const width = { width: halfWidth * 2 };

    const absAngle = Math.abs(angle);

    const secondHalfPull = {
      marginLeft: -halfWidth,
    };

    return renderHorizontalPage(
      absAngle,
      page,
      direction,
      width,
      secondHalfPull,
      styles,
      index,
      this,
      previousPage,
      thisPage,
      nextPage,
    );
  }

  renderPage(component, index) {
    const {
      children, orientation, loopForever, reverse,
    } = this.props;

    const pages = children.length;

    const thisPage = component;
    let nextPage;
    let previousPage;
    if (reverse) {
      previousPage = index + 1 < pages ? children[index + 1] : (loopForever ? children[0] : null);
      nextPage = index > 0 ? children[index - 1] : (loopForever ? children[pages - 1] : null);
    }
    else {
      nextPage = index + 1 < pages ? children[index + 1] : (loopForever ? children[0] : null);
      previousPage = index > 0 ? children[index - 1] : (loopForever ? children[pages - 1] : null);
    }
    if (orientation === 'vertical') {
      return this.renderVerticalPage(previousPage, thisPage, nextPage, index);
    }
    return this.renderHorizontalPage(previousPage, thisPage, nextPage, index);
  }

  render() {
    const { children, isVisible, swipeEnabled } = this.props;
    if (!isVisible) return null;

    const { page, halfWidth, halfHeight } = this.state;
    const from = page > 0 ? page - 1 : 0;
    const to = from + 3;
    const panHandlers = swipeEnabled ? this.panResponder.panHandlers : {};
    return (
      <View
        style={[styles.container]}
        {...panHandlers}
        onLayout={this.onLayout}
      >
        {!!halfWidth && !!halfHeight && children.slice(from, to).map((component, index) => (
          this.renderPage(component, from + index)
        ))}
      </View>
    );
  }
}

FlipPage.propTypes = {
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  loopForever: PropTypes.bool,
  onFinish: PropTypes.func,
  onPageChange: PropTypes.func,
  onSwipeStart: PropTypes.func,
  onSwipeStop: PropTypes.func,
  reverse: PropTypes.bool,
  children: PropTypes.node,
  isVisible: PropTypes.bool,
  swipeEnabled: PropTypes.bool,
};

FlipPage.defaultProps = {
  orientation: 'vertical',
  loopForever: false,
  onFinish: null,
  onPageChange: () => {},
  onSwipeStart: null,
  onSwipeStop: null,
  reverse: false,
  children: <></>,
  isVisible: true,
  swipeEnabled: true,
};

export default FlipPage;
