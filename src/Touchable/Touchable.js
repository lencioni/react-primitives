const React = require('react');
const Animated = require('animated');
const TouchableMixin = require('./TouchableMixin');
const TimerMixin = require('react-timer-mixin');
const ensurePositiveDelayProps = require('./ensurePositiveDelayProps');

const { PropTypes } = React;

const noop = () => { /* empty */ };

const InsetPropType = PropTypes.shape({
  top: PropTypes.number,
  left: PropTypes.number,
  bottom: PropTypes.number,
  right: PropTypes.number,
});

/**
 * A wrapper for making views respond properly to touches.
 * On press down, the opacity of the wrapped view is decreased, dimming it.
 * This is done without actually changing the view hierarchy, and in general is
 * easy to add to an app without weird side-effects.
 *
 * Example:
 *
 * ```
 * renderButton: function() {
 *   return (
 *     <TouchableAnimated press={anim} onPress={this._onPressButton}>
 *       <Image
 *         style={styles.button}
 *         source={require('image!myButton')}
 *       />
 *     </TouchableAnimated>
 *   );
 * },
 * ```
 */
const Touchable = React.createClass({
  propTypes: {
    accessible: PropTypes.bool,

    // TODO:
    // accessibilityComponentType: PropTypes.oneOf(View.AccessibilityComponentType),
    // accessibilityTraits: PropTypes.oneOfType([
    //   PropTypes.oneOf(View.AccessibilityTraits),
    //   PropTypes.arrayOf(PropTypes.oneOf(View.AccessibilityTraits)),
    // ]),
    /**
     * If true, disable all interactions for this component.
     */
    disabled: PropTypes.bool,
    /**
     * Called when the touch is released, but not if cancelled (e.g. by a scroll
     * that steals the responder lock).
     */
    onPress: PropTypes.func,
    onPressIn: PropTypes.func,
    onPressOut: PropTypes.func,
    /**
     * Invoked on mount and layout changes with
     *
     *   `{nativeEvent: {layout: {x, y, width, height}}}`
     */
    onLayout: PropTypes.func,

    onLongPress: PropTypes.func,

    /**
     * Delay in ms, from the start of the touch, before onPressIn is called.
     */
    delayPressIn: PropTypes.number,
    /**
     * Delay in ms, from the release of the touch, before onPressOut is called.
     */
    delayPressOut: PropTypes.number,
    /**
     * Delay in ms, from onPressIn, before onLongPress is called.
     */
    delayLongPress: PropTypes.number,
    /**
     * When the scroll view is disabled, this defines how far your touch may
     * move off of the button, before deactivating the button. Once deactivated,
     * try moving it back and you'll see that the button is once again
     * reactivated! Move it back and forth several times while the scroll view
     * is disabled. Ensure you pass in a constant to reduce memory allocations.
     */
    pressRetentionOffset: InsetPropType,
    /**
     * This defines how far your touch can start away from the button. This is
     * added to `pressRetentionOffset` when moving off of the button.
     * ** NOTE **
     * The touch area never extends past the parent view bounds and the Z-index
     * of sibling views always takes precedence if a touch hits two overlapping
     * views.
     */
    hitSlop: InsetPropType,
    activeValue: PropTypes.number,
    press: PropTypes.instanceOf(Animated.Value),

    pressDuration: PropTypes.number,
    children: PropTypes.node,
  },

  mixins: [TimerMixin, TouchableMixin],

  statics: {
    Mixin: TouchableMixin,
  },

  getDefaultProps() {
    return {
      activeValue: 1,
      delayPressIn: 0,
      delayPressOut: 100,
      delayLongPress: 500,
      pressDuration: 150,
      pressRetentionOffset: {
        top: 20,
        left: 20,
        right: 20,
        bottom: 30,
      },
      onPress: noop,
      onLongPress: noop,
      onPressIn: noop,
      onPressOut: noop,
      press: new Animated.Value(0),
    };
  },

  getInitialState() {
    return this.touchableGetInitialState();
  },

  componentDidMount() {
    ensurePositiveDelayProps(this.props);
  },

  componentWillReceiveProps(nextProps) {
    ensurePositiveDelayProps(nextProps);
  },

  setPressValue(value) {
    Animated.timing(
      this.props.press,
      { toValue: value, duration: this.props.pressDuration }
    ).start();
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandleActivePressIn(e) {
    this.clearTimeout(this._hideTimeout);
    this._hideTimeout = null;
    this._setActive();
    this.props.onPressIn(e);
  },

  touchableHandleActivePressOut(e) {
    if (!this._hideTimeout) {
      this._setInactive();
    }
    this.props.onPressOut(e);
  },

  touchableHandlePress(e) {
    this.clearTimeout(this._hideTimeout);
    this._setActive();
    this._hideTimeout = this.setTimeout(
      this._setInactive,
      this.props.delayPressOut
    );
    this.props.onPress(e);
  },

  touchableHandleLongPress(e) {
    this.props.onLongPress(e);
  },

  touchableGetPressRectOffset() {
    return this.props.pressRetentionOffset;
  },

  touchableGetHitSlop() {
    return this.props.hitSlop;
  },

  touchableGetHighlightDelayMS() {
    return this.props.delayPressIn;
  },

  touchableGetLongPressDelayMS() {
    return this.props.delayLongPress;
  },

  touchableGetPressOutDelayMS() {
    return this.props.delayPressOut;
  },

  _setActive() {
    this.setPressValue(this.props.activeValue);
  },

  _setInactive() {
    this.clearTimeout(this._hideTimeout);
    this._hideTimeout = null;
    this.setPressValue(0);
  },

  render() {
    return React.cloneElement(this.props.children, {
      onStartShouldSetResponder: this.touchableHandleStartShouldSetResponder,
      onResponderTerminationRequest: this.touchableHandleResponderTerminationRequest,
      onResponderGrant: this.touchableHandleResponderGrant,
      onResponderMove: this.touchableHandleResponderMove,
      onResponderRelease: this.touchableHandleResponderRelease,
      onResponderTerminate: this.touchableHandleResponderTerminate,
    });
  },
});

module.exports = Touchable;
