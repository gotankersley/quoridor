#define WASM_EXPORT __attribute__((visibility("default"))) extern "C"
typedef long long i64;
//typedef int i32;

const int WALL_COUNT = 10;
const int PLAYER_COUNT = 2;
//const int WALL_SIZE = 8;
//const int FLOOR_SIZE = 9;
const int OUTPUT = 24;
//const TYPE_HORZ = 256; //This is so it can be [type]|[dest]
//const TYPE_VERT = 512; //Power of two for bitflags
const int TYPE_MOVE = 1024;
//const TYPE_JUMP = 2048;
//const TYPE_MOVE_JUMP = TYP

int sharedMemory[PLAYER_COUNT*(WALL_COUNT+2)+1];

unsigned short simpleRand() {
    static unsigned short r = 5531; //dont realy care about start value
    r+=941; //this value must be relative prime to 2^16, so we use all values
    return r;
}  

WASM_EXPORT
int play(int turn) { 
  
  sharedMemory[OUTPUT] = 75 | TYPE_MOVE;
  int x;
  for (int i = 0; i < 10; i++) {
    x = simpleRand();
  }
  return x;
}

WASM_EXPORT
int* getsharedMemoryPtr() {
  return &sharedMemory[0];
}

//Library functions - no stdlib
//inline int absoluteVal(int x) {
//  int const mask = x >> sizeof(int) * 8;
//
//  return (x + mask) ^ mask;
//}

