import OutlineItem from "./OutlineItem.js";
export default class Outline {
  // The outline class takes in document from which the outline will be built.
  #doc;

  // The flat array of items in the outline.
  #items;

  constructor(doc) {
    this.#doc = doc;
    this.#items = new Array();
  }

  /**
   * Returns the flat array of items in the outline in order of appearance.
   * @returns {Array<OutlineItem>} Flat array of all outline items in order.
   */
  getFlattened() {
    return this.#items;
  }

  /**
   * Nests children based on their level into other outline items.
   * @returns {Array<OutlineItems>} Nested array of top level outline items with order of appearance preserved.
   */
  getNested() {
    return Outline.nestChildren(this.#items);
  }

  /**
   * Creates an outline from the current document.
   * @returns {Outline}
   */
  static fromCurrentDocument() {
    //TODO: Each outline item contains a text label, id, and level.
    // Outline class takes in document from which the outline will be built.
    return new Outline(document);
  }

  /**
   * Searches the instanced document for the outline items based on the selectors passed in and maintains the hierarchy based on the order of arguments passed in.
   * @param {...String} selectors List of selectors to search for in order of importance.
   */
  outline() {
    let selectors = Array.from(arguments).map((arg) =>
      arg.toLowerCase().trim()
    );

    // Take a comma separated string of html selectors
    const elems = [...this.#doc.querySelectorAll(selectors.join(","))];

    // Process all headings with anchor links and styling
    this.#items = elems.map((elem) => {
      const header = elem.children[0];
      const label = header.textContent;
      if (!elem.id)
        // If there isn't an ID, we need to make one.
        elem.id = label
          .replace(/[-’/`~!#*$@_%+=.,^&(){}[\]|;:”<>?\\]/g, "")
          .replace(/\s+/g, "-")
          .toLowerCase();

      // Find our indentation level
      let level = -1;
      for (let i = 0; i < selectors.length; i++) {
        if (elem.matches(selectors[i])) {
          level = i + 1;
          break;
        }
      }

      return new OutlineItem(label, elem.id, level);
    });
  }

  /**
   * Nests children based on their level into other outlines.
   * @param {Array<Outline>} outlines
   * @returns {Array<Outline>} Array of top level outline objects. The array itself is the outline tree.
   */
  static nestChildren(outlines) {
    const root = new OutlineItem();
    let parent = root;
    let prevOutline = null;

    outlines.map((outline) => {
      const level = outline.level;
      let prevLevel = prevOutline ? prevOutline.level : 1;

      // Case: We are looking at a top level outline
      if (!prevOutline || level == 1) {
        parent = root;
        parent.children.push(outline); // We don't adopt here because these are top level outlines

        prevOutline = outline;
        return;
      }

      // Case: The item is at the same level as the previous
      if (level == prevLevel) {
        parent.adopt(outline);

        prevOutline = outline;
        return;
      }

      // Case: The item is at a deeper level and should be nested into the previous outline
      if (level > prevLevel) {
        parent = prevOutline;
        parent.adopt(outline);

        prevOutline = outline;
        return;
      }

      // Case: The item is at a shallower level and should be nested into the last outline that would be its parent
      if (level < prevLevel) {
        // We need to find the correct parent, so go backwards until we are at the right level.
        while (level <= parent.level) {
          parent = parent.parent;
        }
        parent.adopt(outline);

        prevOutline = outline;
        return;
      }

      return;
    });

    return root.children;
  }

  /**
   * Creates a treeNode from the outlines as a set of nested unordered lists.
   * @returns {DomElement} Single unordered list node as a treeNode.
   */
  toNodeTree() {
    let outlines = this.getNested(this.#items);

    // Create our root list node and add some styling
    const root = document.createElement("ul");
    root.setAttribute("class", "outline-content");

    // This is our recursive function to nest the lists
    // It takes the children array of an outline and wraps it in an unordered list while checking for grandchildren.
    // It also converts the children to list items and adds them to the parent list.
    let recNestLists = (outlines) => {
      const list = document.createElement("ul");
      list.setAttribute("class", "outline-list");

      // Go through each child
      outlines.map((outline) => {
        // Convert it to a list item and add it to the list
        list.appendChild(outline.toListItem());

        // If it has children, perform this same function on the child array and append that list to the current one.
        if (outline.children.length > 0)
          list.appendChild(recNestLists(outline.children));
      });

      return list;
    };

    // Create our top level items in our list.
    outlines.map((outline) => {
      root.appendChild(outline.toListItem());

      // If it has children, begin recursing through them building nested lists.
      if (outline.children.length > 0)
        root.appendChild(recNestLists(outline.children));
    });

    return root;
  }

  /**
   * Gets the outlines as a nested array of outlines.
   * @returns {Array<Outline>} Array of top level outline objects. The array itself is the outline tree.
   */
  toHtml() {
    let doc = new Document();
    let wordSection = doc.createElement("div");
    wordSection.setAttribute("class", "WordSection1");
    let nodeTree = this.toNodeTree();

    wordSection.appendChild(nodeTree);
    doc.appendChild(wordSection);

    const serializer = new XMLSerializer();
    const subset = doc.querySelector(".WordSection1");
    return serializer.serializeToString(subset);
  }

  /**
   * Adds an Intersection Observer to the items in the current instance.
   *
   * @param {Function} fn - The callback function to be called when an intersection occurs.
   * @param {Object} options - The options for the Intersection Observer. If not provided, default options are used.
   * @param {HTMLElement} options.root - The element that is used as the viewport for checking visibility of the target. Defaults to the outline document.
   * @param {string} options.rootMargin - The margin around the root. Defaults to "0px".
   * @param {number} options.threshold - Indicates at what percentage of the target's visibility the observer's callback should be executed. Defaults to 1.0.
   */
  addIntersectionObserver(fn, options) {
    if (!options)
      options = {
        root: this.#doc,
        rootMargin: "0px",
        threshold: 0.1,
      };
    const intersectionObserver = new IntersectionObserver(fn, options);
    this.#items.map((item) => {
      if (!item.href) return;
      let node = this.#doc.getElementById(item.href);
      if (!node) return;
      intersectionObserver.observe(node);
    });
  }

  /**
   * Clears the styles of all outline items in the document.
   */
  clearAllActive(classList = ".outline-item-active", doc = this.#doc) {
    const classes = classList
      .split(".")
      .filter((item) => item.trim().length > 0);

    doc.querySelectorAll(classList).forEach((item) => {
      classes.forEach((className) => item.classList.remove(className));
    });
  }
}
