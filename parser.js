class ASTNode {
    evaluate(x, vars = {}) {
        throw new Error("evaluate() not implemented");
    }
    toString() {
        return "";
    }
}
class NumberNode extends ASTNode {
    constructor(value) {
        super();
        this.value = value;
    }
    evaluate(x, vars = {}) {
        return this.value;
    }
    toString() {
        return this.value.toString();
    }
}

class VariableNode extends ASTNode {
    constructor(name) {
        super();
        this.name = name; // 'x'
    }
    evaluate(x, vars = {}) {
        if (this.name === 'x') return x;
        return vars[this.name] !== undefined ? vars[this.name] : 0;
    }
    toString() {
        return this.name;
    }
}

class ConstantNode extends ASTNode {
    constructor(name, value) {
        super();
        this.name = name;
        this.value = value;
    }
    evaluate(x, vars = {}) {
        return this.value;
    }
    toString() {
        return this.name;
    }
}

class UnaryOpNode extends ASTNode {
    constructor(op, argument) {
        super();
        this.op = op; // '+' or '-'
        this.argument = argument;
    }
    evaluate(x, vars = {}) {
        const val = this.argument.evaluate(x, vars);
        if (this.op === '-') return -val;
        return val;
    }
    toString() {
        return `${this.op}(${this.argument.toString()})`;
    }
}

class BinaryOpNode extends ASTNode {
    constructor(op, left, right) {
        super();
        this.op = op;
        this.left = left;
        this.right = right;
    }
    evaluate(x, vars = {}) {
        const l = this.left.evaluate(x, vars);
        const r = this.right.evaluate(x, vars);
        switch (this.op) {
            case '+': return l + r;
            case '-': return l - r;
            case '*': return l * r;
            case '/': 
                // Return NaN or infinity instead of crashing
                if (r === 0) return l === 0 ? NaN : (l > 0 ? Infinity : -Infinity);
                return l / r;
            case '^': return Math.pow(l, r);
            default: throw new Error(`Unknown operator: ${this.op}`);
        }
    }
    toString() {
        return `(${this.left.toString()} ${this.op} ${this.right.toString()})`;
    }
}

class FunctionNode extends ASTNode {
    constructor(name, argument) {
        super();
        this.name = name.toLowerCase();
        this.argument = argument;
    }
    evaluate(x, vars = {}) {
        const val = this.argument.evaluate(x, vars);
        switch (this.name) {
            case 'sin': return Math.sin(val);
            case 'cos': return Math.cos(val);
            case 'tan': return Math.tan(val);
            case 'asin': return Math.asin(val);
            case 'acos': return Math.acos(val);
            case 'atan': return Math.atan(val);
            case 'sinh': return Math.sinh(val);
            case 'cosh': return Math.cosh(val);
            case 'tanh': return Math.tanh(val);
            case 'sqrt': return val >= 0 ? Math.sqrt(val) : NaN;
            case 'cbrt': return Math.cbrt(val);
            case 'log': return val > 0 ? Math.log10(val) : NaN;
            case 'ln': return val > 0 ? Math.log(val) : NaN;
            case 'abs': return Math.abs(val);
            case 'exp': return Math.exp(val);
            default: throw new Error(`Unknown function: ${this.name}`);
        }
    }
    toString() {
        return `${this.name}(${this.argument.toString()})`;
    }
}

const TokenType = {
    NUMBER: 'NUMBER',
    VARIABLE: 'VARIABLE',
    CONSTANT: 'CONSTANT',
    OPERATOR: 'OPERATOR',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    FUNCTION: 'FUNCTION',
    EOF: 'EOF'
};

class Token {
    constructor(type, value, position) {
        this.type = type;
        this.value = value;
        this.position = position;
    }
}

class MathParser {
    constructor() {
        this.tokens = [];
        this.current = 0;
        
        // Define constants
        this.constants = {
            'pi': Math.PI,
            'π': Math.PI,
            'e': Math.E
        };

        this.functions = new Set([
            'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 
            'sinh', 'cosh', 'tanh', 'sqrt', 'cbrt', 'log', 'ln', 'abs', 'exp'
        ]);
    }

    tokenize(expression) {
        const tokens = [];
        let i = 0;
        const length = expression.length;

        while (i < length) {
            let char = expression[i];

            // 1. skip whitespace
            if (/\s/.test(char)) {
                i++;
                continue;
            }

            // 2. Parentheses
            if (char === '(') {
                tokens.push(new Token(TokenType.LPAREN, '(', i));
                i++;
                continue;
            }
            if (char === ')') {
                tokens.push(new Token(TokenType.RPAREN, ')', i));
                i++;
                continue;
            }

            // 3. Operators
            if (['+', '-', '*', '/', '^'].includes(char)) {
                tokens.push(new Token(TokenType.OPERATOR, char, i));
                i++;
                continue;
            }

            // 4. Special mathematical symbols
            if (char === 'π') {
                tokens.push(new Token(TokenType.CONSTANT, 'π', i));
                i++;
                continue;
            }
            if (char === '√') {
                tokens.push(new Token(TokenType.FUNCTION, 'sqrt', i));
                i++;
                continue;
            }

            // 5. Numbers (supporting floats and scientific notation like 1.5e-3)
            if (/\d/.test(char) || (char === '.' && i + 1 < length && /\d/.test(expression[i + 1]))) {
                let start = i;
                let hasDot = false;
                
                if (char === '.') {
                    hasDot = true;
                    i++;
                }
                while (i < length && /\d/.test(expression[i])) {
                    i++;
                }
                if (!hasDot && i < length && expression[i] === '.') {
                    hasDot = true;
                    i++;
                    while (i < length && /\d/.test(expression[i])) {
                        i++;
                    }
                }
                
                // Scientific notation support
                if (i < length && (expression[i] === 'e' || expression[i] === 'E')) {
                    let next = i + 1;
                    if (next < length && (expression[next] === '+' || expression[next] === '-')) {
                        next++;
                    }
                    if (next < length && /\d/.test(expression[next])) {
                        i = next;
                        while (i < length && /\d/.test(expression[i])) {
                            i++;
                        }
                    }
                }
                
                const valStr = expression.substring(start, i);
                tokens.push(new Token(TokenType.NUMBER, parseFloat(valStr), start));
                continue;
            }

            // 6. Identifiers (functions, constants, or variables)
            if (/[a-zA-Z_]/.test(char)) {
                let start = i;
                while (i < length && /[a-zA-Z0-9_]/.test(expression[i])) {
                    i++;
                }
                const word = expression.substring(start, i);
                const lowerWord = word.toLowerCase();

                if (lowerWord === 'x') {
                    tokens.push(new Token(TokenType.VARIABLE, 'x', start));
                } else if (lowerWord in this.constants) {
                    tokens.push(new Token(TokenType.CONSTANT, lowerWord, start));
                } else if (this.functions.has(lowerWord)) {
                    tokens.push(new Token(TokenType.FUNCTION, lowerWord, start));
                } else {
                    // Treat unknown multiple letter identifiers as error, or assume implicit mult of variables?
                    // Let's throw an informative error
                    throw new Error(`Unknown identifier "${word}" at position ${start + 1}`);
                }
                continue;
            }

            // Unrecognized character
            throw new Error(`Unexpected character "${char}" at position ${i + 1}`);
        }

        tokens.push(new Token(TokenType.EOF, '', i));
        return tokens;
    }

    // Main entry point to parse a string into an AST
    parse(expression) {
        if (!expression || expression.trim() === '') {
            throw new Error("Expression is empty");
        }
        
        try {
            this.tokens = this.tokenize(expression);
        } catch (e) {
            throw new Error(e.message);
        }
        
        this.current = 0;

        const ast = this.parseExpression();

        if (!this.isAtEnd()) {
            const token = this.peek();
            throw new Error(`Unexpected token "${token.value}" at position ${token.position + 1}`);
        }

        return ast;
    }

    // AST parser methods matching grammar:
    // expression -> term ( ( "+" | "-" ) term )*
    // term       -> power ( ( "*" | "/" ) power | IMPLICIT_MULT power )*
    // power      -> unary ( "^" power )?  (right associative)
    // unary      -> ( "+" | "-" ) unary | primary
    // primary    -> NUMBER | VARIABLE | CONSTANT | FUNCTION primary | FUNCTION "(" expression ")" | "(" expression ")"

    parseExpression() {
        let expr = this.parseTerm();

        while (this.match('+', '-')) {
            const op = this.previous().value;
            const right = this.parseTerm();
            expr = new BinaryOpNode(op, expr, right);
        }

        return expr;
    }

    parseTerm() {
        let term = this.parsePower();

        while (true) {
            if (this.match('*', '/')) {
                const op = this.previous().value;
                const right = this.parsePower();
                term = new BinaryOpNode(op, term, right);
            } else if (this.checkImplicitMultiplication()) {
                // Implicit multiplication, e.g. 2x, x(x+1), sin(x)cos(x)
                const right = this.parsePower();
                term = new BinaryOpNode('*', term, right);
            } else {
                break;
            }
        }

        return term;
    }

    parsePower() {
        let left = this.parseUnary();

        if (this.match('^')) {
            const op = this.previous().value;
            // Exponentiation is right-associative: x^y^z is x^(y^z)
            const right = this.parsePower();
            left = new BinaryOpNode(op, left, right);
        }

        return left;
    }

    parseUnary() {
        if (this.match('+', '-')) {
            const op = this.previous().value;
            const right = this.parseUnary();
            return new UnaryOpNode(op, right);
        }

        return this.parsePrimary();
    }

    parsePrimary() {
        if (this.matchType(TokenType.NUMBER)) {
            return new NumberNode(this.previous().value);
        }

        if (this.matchType(TokenType.VARIABLE)) {
            return new VariableNode(this.previous().value);
        }

        if (this.matchType(TokenType.CONSTANT)) {
            const name = this.previous().value;
            const val = this.constants[name];
            return new ConstantNode(name, val);
        }

        if (this.matchType(TokenType.FUNCTION)) {
            const funcName = this.previous().value;
            
            // Functions can be followed by an argument in parentheses: sin(x)
            // or implicitly without parens (only for unary inputs, e.g., sin x)
            if (this.match('(')) {
                const arg = this.parseExpression();
                this.consume(')', "Expect ')' after function argument");
                return new FunctionNode(funcName, arg);
            } else {
                // Support syntax like 'sin x' or 'sin 2x' or 'sin(pi)'
                // We parse the argument as unary to avoid binding expressions like 'sin x + 2' into 'sin(x + 2)'
                // i.e., 'sin x + 2' parses as '(sin x) + 2'
                const arg = this.parseUnary();
                return new FunctionNode(funcName, arg);
            }
        }

        if (this.match('(')) {
            const expr = this.parseExpression();
            this.consume(')', "Expect ')' after expression");
            return expr;
        }

        // Error cases
        if (this.isAtEnd()) {
            throw new Error(`Unexpected end of expression at position ${this.peek().position}`);
        }
        
        throw new Error(`Expected expression at position ${this.peek().position + 1}, found "${this.peek().value}"`);
    }

    // Helper functions for parser traversal
    match(...values) {
        for (const value of values) {
            if (this.check(value)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    matchType(type) {
        if (this.checkType(type)) {
            this.advance();
            return true;
        }
        return false;
    }

    check(value) {
        if (this.isAtEnd()) return false;
        return this.peek().value === value;
    }

    checkType(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }

    peek() {
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    consume(value, errorMessage) {
        if (this.check(value)) return this.advance();
        const pos = this.isAtEnd() ? this.peek().position : this.peek().position + 1;
        throw new Error(`${errorMessage} at position ${pos}`);
    }

    // Check if the next token triggers implicit multiplication
    checkImplicitMultiplication() {
        if (this.isAtEnd()) return false;
        
        const nextToken = this.peek();
        
        // These tokens trigger implicit multiplication when following a term:
        // Number: 2 x, 2 (x+1) -> 2 * x, 2 * (x+1)
        // Variable: x y, x sin(x) -> x * y, x * sin(x)
        // Constant: 4 pi -> 4 * pi
        // Function: x sin(x) -> x * sin(x)
        // Left Parenthesis: (x+1)(x+2) -> (x+1) * (x+2)
        const implicitTypes = [
            TokenType.NUMBER, 
            TokenType.VARIABLE, 
            TokenType.CONSTANT, 
            TokenType.FUNCTION,
            TokenType.LPAREN
        ];
        
        return implicitTypes.includes(nextToken.type);
    }
}

window.MathParser = MathParser;
