## 2024-07-15 - Interactive Overlay Keyboard Nav
**Learning:** Adding explicit `:focus-visible` styles to floating overlay controls (like close buttons) is critical when elements are moved off-screen (e.g. right: -450px to right: 0) as native focus rings often get clipped or missed entirely by users navigating purely with keyboard.
**Action:** Ensure all animated or off-canvas UI panels have custom, high-contrast `:focus-visible` styling applied to their interactive elements to guarantee visibility during keyboard navigation.
