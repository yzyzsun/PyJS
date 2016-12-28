%lex

ID      [A-Za-z_][A-Za-z0-9_]*
BIN     [01]
OCT     [0-7]
DEC     [0-9]
HEX     [0-9A-Fa-f]
EXP     [Ee][+-]?{DEC}+
SPACE   [ \t]
NEWLINE \n|\r\n?

%%

{DEC}+{EXP}             return 'FLOAT';
{DEC}+"."{DEC}*{EXP}?   return 'FLOAT';
{DEC}*"."{DEC}+{EXP}?   return 'FLOAT';

[1-9]{DEC}*     return 'DEC_INTEGER';
0[Bb]{BIN}+     return 'BIN_INTEGER';
0[Oo]{OCT}+     return 'OCT_INTEGER';
0[Xx]{HEX}+     return 'HEX_INTEGER';
0+              return 'DEC_INTEGER';

\'(\\.|[^\\'])*\'   return 'STRING_LITERAL';
\"(\\.|[^\\"])*\"   return 'STRING_LITERAL';

"False" return 'FALSE';
"None"  return 'NONE';
"True"  return 'TRUE';

"and"       return 'AND';
"break"     return 'BREAK';
"class"     return 'CLASS';
"continue"  return 'CONTINUE';
"def"       return 'DEF';
"del"       return 'DEL';
"elif"      return 'ELIF';
"else"      return 'ELSE';
"for"       return 'FOR';
"global"    return 'GLOBAL';
"if"        return 'IF';
"in"        return 'IN';
"is"        return 'IS';
"nonlocal"  return 'NONLOCAL';
"not"       return 'NOT';
"or"        return 'OR';
"pass"      return 'PASS';
"return"    return 'RETURN';
"while"     return 'WHILE';

{ID}    return 'IDENTIFIER';

"**="   return '**=';
"//="   return '//=';
"<<="   return '<<=';
">>="   return '>>=';

"=="    return '==';
"!="    return '!=';
"<="    return '<=';
">="    return '>=';
"**"    return '**';
"//"    return '//';
"<<"    return '<<';
">>"    return '>>';
"+="    return '+=';
"-="    return '-=';
"*="    return '*=';
"/="    return '/=';
"%="    return '%=';
"&="    return '&=';
"^="    return '^=';
"|="    return '|=';

"<"     return '<';
">"     return '>';
"+"     return '+';
"-"     return '-';
"*"     return '*';
"/"     return '/';
"%"     return '%';
"~"     return '~';
"&"     return '&';
"^"     return '^';
"|"     return '|';
"="     return '=';
"("     return '(';
")"     return ')';
"["     return '[';
"]"     return ']';
"{"     return '{';
"}"     return '}';
":"     return ':';
","     return ',';
";"     return ';';
"."     return '.';
"@"     return '@';

({NEWLINE}{SPACE}*)+<<EOF>>     {
                                    var tokens = ['NEWLINE'];
                                    while (indentStack.pop() !== '') {
                                        tokens.unshift('DEDENT');
                                    }
                                    return tokens;
                                }

({NEWLINE}{SPACE}*)+/{NEWLINE}  /* skip blank lines */

{NEWLINE}{SPACE}*   {
                        var current = yytext.replace(/[\r\n]/g, '');
                        var last = indentStack[indentStack.length - 1];
                        if (current.startsWith(last)) {
                            if (current.length > last.length) {
                                indentStack.push(current);
                                return ['INDENT', 'NEWLINE'];
                            }
                        }
                        var tokens = ['NEWLINE'];
                        while (current.length < last.length) {
                            indentStack.pop();
                            last = indentStack[indentStack.length - 1];
                            tokens.unshift('DEDENT');
                        }
                        if (current === last) {
                            return tokens;
                        } else {
                            this.parseError(`Indentation on line ${yylineno + 1} does not match any level`, {});
                        }
                    }

{SPACE}+    /* skip other whitespace */

%%

indentStack = ['']

/lex

%options token-stack

%left   OR
%left   AND
%right  NOT
%nonassoc   IN IS '==' '!=' '<' '>' '<=' '>='
%left   '|'
%left   '^'
%left   '&'
%left   '<<' '>>'
%left   '+' '-'
%left   '*' '/' '//' '%'
%right  POS NEG '~'
%right  '**'

%start file_input

%%

file_input
    : statement_or_newline
    | file_input statement_or_newline
    ;

statement_or_newline
    : statement
    | NEWLINE
    ;

statement
    : stmt_list NEWLINE
    | compound_stmt
    ;

stmt_list
    : simple_stmt
    | stmt_list ';' simple_stmt
    ;

simple_stmt
    : expression_stmt
    | assignment_stmt
    | augmented_assignment_stmt
    | PASS
    | DEL target
    | return_stmt
    | BREAK
    | CONTINUE
    | GLOBAL global_list
    | NONLOCAL nonlocal_list
    ;

expression_stmt
    : expression
    ;

expression
    : expr
    | expr IF expr ELSE expression
    ;

expr
    : primary
    | expr OR expr
    | expr AND expr
    | NOT expr
    | expr IN expr
    | expr IS expr
    | expr '==' expr
    | expr '!=' expr
    | expr '<' expr
    | expr '>' expr
    | expr '<=' expr
    | expr '>=' expr
    | expr '|' expr
    | expr '^' expr
    | expr '&' expr
    | expr '<<' expr
    | expr '>>' expr
    | expr '+' expr
    | expr '-' expr
    | expr '*' expr
    | expr '/' expr
    | expr '//' expr
    | expr '%' expr
    | '+' expr %prec POS
    | '-' expr %prec NEG
    | '~' expr
    | expr '**' expr
    ;

primary
    : target
    | literal
    | '(' expression_list ')'
    | '[' expression_list ']'
    | '{' expression_list '}'
    | '{' key_datum_list '}'
    | primary argument_list_enclosure
    ;

target
    : IDENTIFIER
    | primary '.' IDENTIFIER
    | primary '[' expression ']'
    ;

argument_list_enclosure
    : '(' ')'
    | '(' argument_list ')'
    ;

argument_list
    : expression
    | argument_list ',' expression
    ;

literal
    : STRING_LITERAL
    | FLOAT
    | DEC_INTEGER
    | BIN_INTEGER
    | OCT_INTEGER
    | HEX_INTEGER
    | TRUE
    | FALSE
    | NONE
    ;

expression_list
    : expression
    | expression_list ',' expression
    ;

key_datum_list
    : expression ':' expression
    | key_datum_list ',' expression ':' expression
    ;

assignment_stmt
    : target '=' expression
    | target '=' assignment_stmt
    ;

augmented_assignment_stmt
    : target '+=' expression
    | target '-=' expression
    | target '*=' expression
    | target '/=' expression
    | target '//=' expression
    | target '%=' expression
    | target '**=' expression
    | target '<<=' expression
    | target '>>=' expression
    | target '&=' expression
    | target '^=' expression
    | target '|=' expression
    ;

return_stmt
    : RETURN
    | RETURN expression
    ;

global_list
    : IDENTIFIER
    | global_list ',' IDENTIFIER
    ;

nonlocal_list
    : IDENTIFIER
    | nonlocal_list ',' IDENTIFIER
    ;

compound_stmt
    : if_stmt
    | while_stmt
    | for_stmt
    | funcdef
    | classdef
    ;

suite
    : stmt_list NEWLINE
    | NEWLINE INDENT statements DEDENT
    ;

statements
    : statement
    | statements statement
    ;

if_stmt
    : IF expression ':' suite
    | IF expression ':' suite ELSE ':' suite
    | IF expression ':' suite elif_suite
    | IF expression ':' suite elif_suite ELSE ':' suite
    ;

elif_suite
    : ELIF expression ':' suite
    | elif_suite ELIF expression ':' suite
    ;

while_stmt
    : WHILE expression ':' suite
    | WHILE expression ':' suite ELSE ':' suite
    ;

for_stmt
    : FOR target IN expression ':' suite
    | FOR target IN expression ':' suite ELSE ':' suite
    ;

funcdef
    : DEF IDENTIFIER parameter_list_enclosure ':' suite
    | decorator DEF IDENTIFIER parameter_list_enclosure ':' suite
    ;

decorator
    : '@' IDENTIFIER NEWLINE
    ;

parameter_list_enclosure
    : '(' ')'
    | '(' parameter_list ')'
    ;

parameter_list
    : IDENTIFIER
    | parameter_list ',' IDENTIFIER
    ;

classdef
    : CLASS IDENTIFIER ':' suite
    | CLASS IDENTIFIER '(' argument_list ')' ':' suite
    ;
