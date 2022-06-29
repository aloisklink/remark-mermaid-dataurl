# Git Graph mermiad example

Here is an experimental example of using git graph

```mermaid
gitGraph:
options
{
    "nodeSpacing": 150,
    "nodeRadius": 10
}
end
commit
branch newbranch
checkout newbranch
commit
commit
checkout main
commit
commit
merge newbranch
```
