# Reusable Components

This directory contains all reusable components used throughout the EA FC 26 Tournament app.

## Components

### Avatar

**Purpose:** Display participant avatars (emoji or uploaded photos)

**Props:**

- `participant` (object) - Participant data with avatar/customImage
- `size` (string) - "small" | "medium" | "large" (default: "medium")

**Usage:**

```jsx
<Avatar participant={participant} size="medium" />
```

### Button

**Purpose:** Standardized button component with variants

**Props:**

- `children` (node) - Button text/content
- `onClick` (function) - Click handler
- `variant` (string) - "primary" | "success" | "danger" | "secondary" (default: "primary")
- `disabled` (boolean) - Disable state
- `fullWidth` (boolean) - Full width button
- `className` (string) - Additional CSS classes

**Usage:**

```jsx
<Button onClick={handleClick} variant="primary">
  Click Me
</Button>
```

### ClubCard

**Purpose:** Display club information in a card format

**Props:**

- `club` (object) - Club data with name, league, rating, logo
- `isHighlighted` (boolean) - Highlight state for animations
- `onClick` (function) - Click handler

**Usage:**

```jsx
<ClubCard club={club} isHighlighted={spinning && index === currentIndex} />
```

### ClubLogo

**Purpose:** Display club logo with optional name

**Props:**

- `club` (object) - Club data with name and logo
- `size` (string) - "small" | "medium" | "large" (default: "medium")
- `showName` (boolean) - Show club name next to logo

**Usage:**

```jsx
<ClubLogo club={club} size="medium" showName={false} />
```

### Container

**Purpose:** Consistent container wrapper with UEFA theme styling

**Props:**

- `children` (node) - Container content
- `className` (string) - Additional CSS classes

**Usage:**

```jsx
<Container>
  <h2>Page Content</h2>
</Container>
```

### Modal

**Purpose:** Modal dialog for forms and overlays

**Props:**

- `isOpen` (boolean) - Modal visibility state
- `onClose` (function) - Close handler
- `title` (string) - Modal title
- `children` (node) - Modal content

**Usage:**

```jsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Add Match Result"
>
  <form>...</form>
</Modal>
```

### OrderBadge

**Purpose:** Display participant order number badge

**Props:**

- `order` (number) - Order number
- `variant` (string) - "default" | "small" | "large" (default: "default")

**Usage:**

```jsx
<OrderBadge order={1} variant="small" />
```

### PlayerCard

**Purpose:** Display participant information in a card (not currently used but available)

**Props:**

- `participant` (object) - Participant data
- `children` (node) - Additional card content
- `className` (string) - Additional CSS classes

**Usage:**

```jsx
<PlayerCard participant={participant}>
  <p>Additional info</p>
</PlayerCard>
```

## Benefits of Componentization

1. **Reusability** - Components can be used across multiple pages
2. **Consistency** - Same styling and behavior everywhere
3. **Maintainability** - Change in one place affects all usages
4. **Props-based** - Flexible configuration through props
5. **Themed** - All components follow UEFA Champions League design
6. **Type Safety** - Clear prop interfaces

## Component Import Patterns

**Individual imports:**

```jsx
import Avatar from "../components/Avatar";
import Button from "../components/Button";
```

**Batch import (using index.js):**

```jsx
import { Avatar, Button, Modal } from "../components";
```
