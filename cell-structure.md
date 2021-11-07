# Cell structure description

| bytes offset | type             | description |
| ------------ | ---------------- | ----------- |
| 0            | array\<u8\>[256] | genes       | 
| 256          | u16              | cursor      |
| 258          | u16              | stamina     |
| 260          | u32              | age         |
| 264          | u8               | variant     |
| 265          | u8               | plant       |
| 266          | u8               | predator    |
| 267          | u8               | intention   |
| 268          | u8               | direction   |
| 269-271      | -                | *reserved*  |


## Genes
### array of Unsigned 8-bit integer with 256 elements
| gen id | name    | description                                                                              |
| ------ | ------- | ---------------------------------------------------------------------------------------- |
| 0      | wait    | go to the next gen                                                                       |
| 1-7    | rotateN | rotate to  `newDir = currentDir + genId`                                                 |
| 8      | move    | move current cell forward next cell is free, bite life cell, eat food, skip turn if wall |


## Variant
### Unsigned 8-bit integer
| value | description      |
| ----- | ---------------- |
| 0     | empty space      |
| 1     | unbreakable wall |
| 2     | food             |
| 3     | life cell        |


## Stamina
### Unsigned 16-bit integer  
Stamina is required for every cell action. Each action requires a different amount of stamina. Also, stamina decreases with each cycle.


## Cursor
### Unsigned 16-bit integer
Represents current gen position.  
Note: 2 bytes reserved for future versions.


## Age
### Unsigned 8-bit integer
Increases every cycle.


## Predator
### Unsigned 8-bit integer
Increases each time a cell eats another cell.


## Intention
### Unsigned 8-bit integer
Stores cell's movement action intention to process it


## Plant
### Unsigned 8-bit integer
Increases each time a cell gains stamina through photosynthesis.


## Direction
### Unsigned 8-bit integer
Directions:
||||
|---|---|---|
| 6 | 5 | 4 |
| 7 | - | 3 |
| 0 | 1 | 2 |
