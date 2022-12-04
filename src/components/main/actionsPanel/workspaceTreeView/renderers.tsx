import { TreeRenderProps } from 'react-complex-tree';

export const renderers: TreeRenderProps = {
  /* renderItemTitle: (props) => {
    if (!info.isSearching || !context.isSearchMatching) {
      return <span className={Classes.TREE_NODE_LABEL}>{title}</span>;
    }
    const startIndex = title.toLowerCase().indexOf(info.search!.toLowerCase());
    return (
      <>
        {startIndex > 0 && <span>{title.slice(0, startIndex)}</span>}
        <span className="rct-tree-item-search-highlight">
          {title.slice(startIndex, startIndex + info.search!.length)}
        </span>
        {startIndex + info.search!.length < title.length && (
          <span>
            {title.slice(startIndex + info.search!.length, title.length)}
          </span>
        )}
      </>
    );
  }, */

  /* renderRenameInput: props => (
    <form {...props.formProps} style={{ display: 'contents', color: "black" }} onClick={(e) => { e.stopPropagation() }}>
      <span className={Classes.TREE_NODE_LABEL}>
        <input
          {...props.inputProps}
          ref={props.inputRef}
          className="rct-tree-item-renaming-input"
        />
      </span>
      <span className={Classes.TREE_NODE_SECONDARY_LABEL}>
        <Button
          icon="tick"
          {...(props.submitButtonProps as any)}
          type="submit"
          minimal
          small
        />
      </span>
    </form>
  ),

  renderSearchInput: props => (
    <div className={cx('rct-tree-search-input-container')}>
      <InputGroup {...(props.inputProps as any)} placeholder="Search..." />
    </div>
  ), */

  renderDepthOffset: 1,
};