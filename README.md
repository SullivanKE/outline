# Outline Component
## Overview
The Outline Component is a versatile tool that reads the content of an HTML page and generates a dynamic sidebar navigation. This sidebar is built based on the query selectors you pass in, allowing for flexible and customizable navigation structures. Perfect for enhancing the user experience on content-heavy websites or documentation pages.

## Features

- **Dynamic Sidebar Navigation:** Automatically creates a navigation sidebar based on HTML content.
- **Customizable Query Selectors:** Define which elements are included in the sidebar using query selectors.
- **Easy Integration:** Simple setup and integration into existing HTML pages.

## Installation

You can install this via NPM:
```bash
npm install @ocdla/outline
```
Then, import it into your JavaScript:
```javascript
import Outline from '@ocdla/Outline';
```

## Usage

### Basic use case
Basic usage is as follows:
- Create a new outline object specifying the region to parse
- Parse the region with the outline method `outline.outline()` passing in query selectors in order of importance. Level 1 top level items should be listed first.
- Retrieve the outline via one of the methods shown below.
```javascript
import Outline from '@ocdla/Outline';


// You can create an outline from the full document, or by specifying a parent element to get a more specific section.
const outline = Outline.fromCurrentDocument();
const bodyOutline = new Outline(document.querySelector('#body');

// Content is in section tags with class names .level1, .level2, etc. The order here matters, as the first arguments passed in are considered closer to root level.
outline.outline(
  ".level1",
  ".level2",
  ".level3",
  ".level4",
  ".level5",
  ".level6"
);

// Returns an array of nested outline item objects, each nested in the 'children' instance array of their parent
// This would be used if you're using some form of JSX or you had more manipulation to perform.
outline.getNested();

// Returns a flat array of outline items without nesting
outline.getFlattened();

// Returns a parent <ul> object that contains a <li> entry for each outline item with nested <ul> elements for any indentation
outline.toNodeTree();

// Returns a string of HTML as if you used outline.toNodeTree();
outline.toHtml();

```

### Intersection Observers

Intersection observers are used to create an interactive outline that highlights the section you have scrolled to. This is done by passing a callback function to `outline.addIntersectionObserver()`
For more information on intersection observers, see the MDN documentation here: https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver

```javascript
 // Callback function used to detect where the user is on the page.
      const handleIntersection = (observedEntries) => {
        // Filter out entries that are not intersecting
        const intersectingEntries = observedEntries.filter(
          (entry) => entry.isIntersecting
        );

        // Make sure we have at least one entry remaining
        if (intersectingEntries.length == 0) return;

        // Iterate through our outline items and clear their styles.
        outline.clearAllActive(
          ".bg-black.text-white",
          document.querySelector("#outline")
        );

        // We only want the first entry. It's possible to scroll through multiple headings at once.
        const entry = intersectingEntries[0];
        const id = entry.target.id;
        const outlineListItem = document.getElementById(`${id}-outline-item`);

        // When we see a new item, we want to make sure the outline sidebar is scrolling to it.
        outlineListItem.scrollIntoView({
          behavior: "instant",
          block: "nearest",
          inline: "center",
        });

        // Add the active class styling to the current item.
        outlineListItem.classList.add("bg-black");
        outlineListItem.classList.add("text-white");
      };

      // Add the callback function to the intersection observer.
      outline.addIntersectionObserver(handleIntersection);


      // You can also specify a set of options to pass in per the Intersection Observer documentation
      const options = {
        root: this.#doc,
        rootMargin: "0px",
        threshold: 0.1,
      };

      outline.addIntersectionObserver(handleIntersection, options);
```
