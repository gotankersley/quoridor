DEPS = 
OBJ = quoridor.o
OUTPUT = quoridor.wasm

$(OUTPUT): $(OBJ) quoridor.syms Makefile
	wasm-ld-8 \
		-o $(OUTPUT) \
		--no-entry \
		-allow-undefined-file quoridor.syms \
		--strip-all \
		--export-dynamic \
		--initial-memory=131072 \
		$(OBJ)

%.o: %.cpp $(DEPS) Makefile
	clang++-8 \
		-c \
		-Wall \
		-Werror \
		--target=wasm32 \
		-Os \
		-o $@ \
		-nostdlib \
		-fvisibility=hidden \
		$<

library.wat: $(OUTPUT) Makefile
	~/build/wabt/wasm2wat -o quoridor.wat $(OUTPUT)

wat: library.wat

clean:
	rm -f $(OBJ) $(OUTPUT) quoridor.wat
