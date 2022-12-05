import { useEditor, useNode } from "@craftjs/core";
import React from "react";
import { useCallback, useEffect, useRef } from "react";

type RenderNodeProp = {
    render: React.ReactElement
};
export const RenderNode = (props: RenderNodeProp) => {
    const { id } = useNode();
    const { actions, query, isActive } = useEditor((_, query) => ({
        isActive: query.getEvent('selected').contains(id),
    }));

    const {
        isHover,
        dom,
        isRoot,
        connectors: { drag },
    } = useNode((node) => ({
        isHover: node.events.hovered,
        isRoot: query.node(node.id).isRoot(),
        dom: node.dom,
        name: node.data.custom.displayName || node.data.displayName,
        moveable: query.node(node.id).isDraggable(),
        deletable: query.node(node.id).isDeletable(),
        parent: node.data.parent,
        props: node.data.props,
    }));


    useEffect(() => {
        if (dom && !isRoot) {
            dom.classList.remove('component-selected')
            dom.classList.remove('component-hovered')
            console.log(isActive, isHover)
            isActive ? dom.classList.add('component-selected')
                : isHover ? dom.classList.add('component-hovered') 
                : {}
        }
    }, [dom, isActive, isHover]);

    return (
        <>
            {props.render}
        </>
    );
};