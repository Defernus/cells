# Cell structure description

| bytes offset | type             | description |
| ------------ | ---------------- | ----------- |
| 0            | array\<u8\>[256] | genes       | 
| 256          | u32              | cursor      |
| 260          | u32              | stamina     |
| 264          | u32              | age         |
| 268          | u32              | variant     |
| 272          | u32              | plant       |
| 276          | u32              | predator    |
| 280          | u32              | intention   |
| 284          | u32              | direction   |


## Genes
### array of Unsigned 8-bit integer with 256 elements
| gen id | name    | description                                                                              |
| ------ | ------- | ---------------------------------------------------------------------------------------- |
| 0      | wait    | go to the next gen                                                                       |
| 1-7    | rotateN | rotate to  `newDir = currentDir + genId`                                                 |
| 8      | move    | move current cell forward next cell is free, bite life cell, eat food, skip turn if wall |


## Variant
| value | description      |
| ----- | ---------------- |
| 0     | empty space      |
| 1     | unbreakable wall |
| 2     | food             |
| 3     | life cell        |


## Stamina
Stamina is required for every cell action. Each action requires a different amount of stamina. Also, stamina decreases with each cycle.


## Cursor
Represents current gen position.  
Note: 2 bytes reserved for future versions.


## Age
Increases every cycle.


## Predator
Increases each time a cell eats another cell.


## Intention
Stores cell's movement action intention to process it
// TODO intentions list


## Plant
Increases each time a cell gains stamina through photosynthesis.


## Direction
Directions:
||||
|---|---|---|
| 6 | 5 | 4 |
| 7 | - | 3 |
| 0 | 1 | 2 |
