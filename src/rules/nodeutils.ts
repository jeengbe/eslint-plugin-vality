import { TSESTree } from "@typescript-eslint/utils";

const NODES = TSESTree.AST_NODE_TYPES;

/**
 * Whether the node is within an 'as const' context
 */
export function isWithinAsConstContext(node: TSESTree.Node): boolean {
  do {
    if (
      node.type === NODES.TSAsExpression &&
      node.typeAnnotation.type === NODES.TSTypeReference &&
      node.typeAnnotation.typeName.type === NODES.Identifier &&
      node.typeAnnotation.typeName.name === "const"
    ) {
      return true;
    }

    // Only traverse objects and arrays upwards
    if (
      node.type !== NODES.Property &&
      node.type !== NODES.ObjectExpression &&
      node.type !== NODES.ArrayExpression
    ) {
      return false;
    }

    if (!node.parent) return false;
  } while (node = node.parent);
  return false;
}

/**
 * Whether one of the node's 'as const' parents requires 'as const'
 */
export function isWithinRequiresAsConstContext(node: TSESTree.Node): boolean {
  if (!node.parent) return false;

  while(node = node.parent) {
    // Only traverse objects and arrays upwards
    if (
      node.type !== NODES.Property &&
      node.type !== NODES.ObjectExpression &&
      node.type !== NODES.ArrayExpression
    ) {
      return false;
    }

    if (requiresAsConst(node)) return true;

    if (!node.parent) return false;
  };

  return false;
}

/**
 * Whether the passed node is an identifier for the Vality object
 */
export function isVality(node: TSESTree.Node): boolean {
  return (
    node.type === NODES.Identifier &&
    (node.name === "v" || node.name === "vality")
  );
}

/**
 * Whether the passed node should be within an 'as const' context
 */
export function requiresAsConst(
  node: TSESTree.Node,
  parentHasTrigger = false
): boolean {
  switch (node.type) {
    case NODES.ObjectExpression:
      return objectRequiresAsConst(node, parentHasTrigger);
    case NODES.ArrayExpression:
    case NODES.Literal:
      return parentHasTrigger;
    case NODES.Property:
      return requiresAsConst(node.value, parentHasTrigger);
    default:
      return false;
  }
}

export function objectRequiresAsConst(
  node: TSESTree.ObjectExpression,
  parentHasTrigger = false
): boolean {
  let hasTrigger = parentHasTrigger;

  if (!hasTrigger) {
    for (const prop of node.properties) {
      /* istanbul ignore next */
      if (prop.type === NODES.SpreadElement) continue;

      if (isTrigger(prop.value)) {
        hasTrigger = true;
        break;
      }
    }
    if (!hasTrigger) return false;
  }

  for (const prop of node.properties) {
    /* istanbul ignore next */
    if (prop.type === NODES.SpreadElement) continue;

    if (requiresAsConst(prop, true)) return true;
  }
  return false;
}

export function arrayRequiresAsConst(
  node: TSESTree.ArrayExpression,
): boolean {
    for (const prop of node.elements) {
      /* istanbul ignore next */
      if (prop.type === NODES.SpreadElement) continue;

      if (isTrigger(prop)) {
        return true;
      }
    }
  return false;
}

export function parentIsTrigger(node: TSESTree.Node): boolean {
  if (!node.parent) return false;
  return isTrigger(node.parent);
}

/**
 * Whether the precence of this node indicates that the its containing node is a Vality short
 */
export function isTrigger(node: TSESTree.Node): boolean {
  switch (node.type) {
    case NODES.ObjectExpression: {
      for (const prop of node.properties) {
        /* istanbul ignore next */
        if (prop.type === NODES.SpreadElement) continue;

        if (isTrigger(prop.value)) return true;
      }
      return false;
    }
    case NODES.ArrayExpression: {
      for (const prop of node.elements) {
        /* istanbul ignore next */
        if (prop.type === NODES.SpreadElement) continue;

        if (isTrigger(prop)) return true;
      }
      return false;
    }
    case NODES.MemberExpression:
      // v.guard
      return isVality(node.object);
    case NODES.CallExpression:
      // v.valit() / v.guard()
      if (node.callee.type === NODES.MemberExpression) {
        return isVality(node.callee.object);
      }
      // v.valit()()
      if (
        node.callee.type === NODES.CallExpression &&
        node.callee.callee.type === NODES.MemberExpression
      ) {
        return isVality(node.callee.callee.object);
      }
    default:
      return false;
  }
}
