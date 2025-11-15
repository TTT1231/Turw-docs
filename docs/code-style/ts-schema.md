# TsSchema

## `schema.json`中文版翻译。

::: code-group

```json [schema.json]
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "$comment": "注意：此模式在多处使用了'null'值。'null'的值是未记录的(https://github.com/microsoft/TypeScript/pull/18058)",
   "allowTrailingCommas": true,
   "allOf": [
      {
         "$ref": "#/definitions/compilerOptionsDefinition"
      },
      {
         "$ref": "#/definitions/compileOnSaveDefinition"
      },
      {
         "$ref": "#/definitions/typeAcquisitionDefinition"
      },
      {
         "$ref": "#/definitions/extendsDefinition"
      },
      {
         "$ref": "#/definitions/watchOptionsDefinition"
      },
      {
         "$ref": "#/definitions/buildOptionsDefinition"
      },
      {
         "$ref": "#/definitions/tsNodeDefinition"
      },
      {
         "anyOf": [
            {
               "$ref": "#/definitions/filesDefinition"
            },
            {
               "$ref": "#/definitions/excludeDefinition"
            },
            {
               "$ref": "#/definitions/includeDefinition"
            },
            {
               "$ref": "#/definitions/referencesDefinition"
            }
         ]
      }
   ],
   "definitions": {
      "//": {
         "explainer": "https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#overview",
         "reference": "https://www.typescriptlang.org/tsconfig",
         "reference metadata": "https://github.com/microsoft/TypeScript-Website/blob/v2/packages/tsconfig-reference/scripts/tsconfigRules.ts"
      },
      "filesDefinition": {
         "properties": {
            "files": {
               "description": "如果tsconfig.json中没有'files'或'include'属性，编译器默认包含包含目录和子目录中的所有文件，除了'exclude'指定的文件。当指定了'files'属性时，只有这些文件和'include'指定的文件会被包含。",
               "type": ["array", "null"],
               "uniqueItems": true,
               "items": {
                  "type": ["string", "null"]
               }
            }
         }
      },
      "excludeDefinition": {
         "properties": {
            "exclude": {
               "description": "指定要从编译中排除的文件列表。'exclude'属性仅影响通过'include'属性包含的文件，而不影响'files'属性。需要TypeScript 2.0或更高版本支持glob模式。",
               "type": ["array", "null"],
               "uniqueItems": true,
               "items": {
                  "type": ["string", "null"]
               }
            }
         }
      },
      "includeDefinition": {
         "properties": {
            "include": {
               "description": "指定匹配要包含在编译中的文件的glob模式列表。如果tsconfig.json中没有'files'或'include'属性，编译器默认包含包含目录和子目录中的所有文件，除了'exclude'指定的文件。需要TypeScript 2.0或更高版本。",
               "type": ["array", "null"],
               "uniqueItems": true,
               "items": {
                  "type": ["string", "null"]
               }
            }
         }
      },
      "compileOnSaveDefinition": {
         "properties": {
            "compileOnSave": {
               "description": "为此项目启用保存时编译。",
               "type": ["boolean", "null"]
            }
         }
      },
      "extendsDefinition": {
         "properties": {
            "extends": {
               "description": "要继承的基础配置文件路径(需要TypeScript 2.1或更高版本)，或基础文件数组，最右侧的文件具有更高的优先级(需要TypeScript 5.0或更高版本)。",
               "oneOf": [
                  {
                     "default": "",
                     "type": "string"
                  },
                  {
                     "default": [],
                     "items": {
                        "type": "string"
                     },
                     "type": "array"
                  }
               ]
            }
         }
      },
      "buildOptionsDefinition": {
         "properties": {
            "buildOptions": {
               "properties": {
                  "dry": {
                     "description": "~",
                     "type": ["boolean", "null"],
                     "default": false
                  },
                  "force": {
                     "description": "构建所有项目，包括那些看起来是最新的项目",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "构建所有项目，包括那些看起来是最新的项目\n\n查看更多: https://www.typescriptlang.org/tsconfig#force"
                  },
                  "verbose": {
                     "description": "启用详细日志记录",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "启用详细日志记录\n\n查看更多: https://www.typescriptlang.org/tsconfig#verbose"
                  },
                  "incremental": {
                     "description": "保存.tsbuildinfo文件以允许项目的增量编译。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "保存.tsbuildinfo文件以允许项目的增量编译。\n\n查看更多: https://www.typescriptlang.org/tsconfig#incremental"
                  },
                  "assumeChangesOnlyAffectDirectDependencies": {
                     "description": "在使用incremental和watch模式的项目中，假设文件中的更改只会影响直接依赖它的文件。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "在使用incremental和watch模式的项目中，假设文件中的更改只会影响直接依赖它的文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#assumeChangesOnlyAffectDirectDependencies"
                  },
                  "traceResolution": {
                     "description": "记录moduleResolution过程中使用的路径。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "记录moduleResolution过程中使用的路径。\n\n查看更多: https://www.typescriptlang.org/tsconfig#traceResolution"
                  }
               }
            }
         }
      },
      "watchOptionsDefinition": {
         "properties": {
            "watchOptions": {
               "type": ["object", "null"],
               "description": "TypeScript监视模式的设置。",
               "properties": {
                  "force": {
                     "description": "~",
                     "type": ["string", "null"]
                  },
                  "watchFile": {
                     "description": "指定TypeScript监视模式的工作方式。",
                     "type": ["string", "null"],
                     "markdownDescription": "指定TypeScript监视模式的工作方式。\n\n查看更多: https://www.typescriptlang.org/tsconfig#watchFile"
                  },
                  "watchDirectory": {
                     "description": "在缺乏递归文件监视功能的系统上指定如何监视目录。",
                     "type": ["string", "null"],
                     "markdownDescription": "在缺乏递归文件监视功能的系统上指定如何监视目录。\n\n查看更多: https://www.typescriptlang.org/tsconfig#watchDirectory"
                  },
                  "fallbackPolling": {
                     "description": "指定如果系统耗尽原生文件监视器时，监视器应使用的方法。",
                     "type": ["string", "null"],
                     "markdownDescription": "指定如果系统耗尽原生文件监视器时，监视器应使用的方法。\n\n查看更多: https://www.typescriptlang.org/tsconfig#fallbackPolling"
                  },
                  "synchronousWatchDirectory": {
                     "description": "在不原生支持递归监视的平台上，同步调用回调并更新目录监视器的状态。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "在不原生支持递归监视的平台上，同步调用回调并更新目录监视器的状态。\n\n查看更多: https://www.typescriptlang.org/tsconfig#synchronousWatchDirectory"
                  },
                  "excludeFiles": {
                     "description": "从监视模式的处理中移除文件列表。",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": ["string", "null"]
                     },
                     "markdownDescription": "从监视模式的处理中移除文件列表。\n\n查看更多: https://www.typescriptlang.org/tsconfig#excludeFiles"
                  },
                  "excludeDirectories": {
                     "description": "从监视过程中移除目录列表。",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": ["string", "null"]
                     },
                     "markdownDescription": "从监视过程中移除目录列表。\n\n查看更多: https://www.typescriptlang.org/tsconfig#excludeDirectories"
                  }
               }
            }
         }
      },
      "compilerOptionsDefinition": {
         "properties": {
            "compilerOptions": {
               "type": ["object", "null"],
               "description": "指示TypeScript编译器如何编译.ts文件。",
               "properties": {
                  "allowArbitraryExtensions": {
                     "description": "启用导入具有任何扩展名的文件，前提是存在声明文件。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "启用导入具有任何扩展名的文件，前提是存在声明文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#allowArbitraryExtensions"
                  },
                  "allowImportingTsExtensions": {
                     "description": "允许导入包含TypeScript文件扩展名。需要设置'--noEmit'或'--emitDeclarationOnly'。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "允许导入包含TypeScript文件扩展名。需要设置'--noEmit'或'--emitDeclarationOnly'。\n\n查看更多: https://www.typescriptlang.org/tsconfig#allowImportingTsExtensions"
                  },
                  "charset": {
                     "description": "不再支持。在早期版本中，手动设置读取文件的文本编码。",
                     "type": ["string", "null"],
                     "markdownDescription": "不再支持。在早期版本中，手动设置读取文件的文本编码。\n\n查看更多: https://www.typescriptlang.org/tsconfig#charset"
                  },
                  "composite": {
                     "description": "启用允许TypeScript项目与项目引用一起使用的约束。",
                     "type": ["boolean", "null"],
                     "default": true,
                     "markdownDescription": "启用允许TypeScript项目与项目引用一起使用的约束。\n\n查看更多: https://www.typescriptlang.org/tsconfig#composite"
                  },
                  "customConditions": {
                     "description": "在解析导入时，除了解析器特定的默认值外，还要设置的条件。",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": ["string", "null"]
                     },
                     "markdownDescription": "在解析导入时，除了解析器特定的默认值外，还要设置的条件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#customConditions"
                  },
                  "declaration": {
                     "description": "从项目中的TypeScript和JavaScript文件生成.d.ts文件。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "从项目中的TypeScript和JavaScript文件生成.d.ts文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#declaration"
                  },
                  "declarationDir": {
                     "description": "指定生成的声明文件的输出目录。",
                     "type": ["string", "null"],
                     "markdownDescription": "指定生成的声明文件的输出目录。\n\n查看更多: https://www.typescriptlang.org/tsconfig#declarationDir"
                  },
                  "diagnostics": {
                     "description": "构建后输出编译器性能信息。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "构建后输出编译器性能信息。\n\n查看更多: https://www.typescriptlang.org/tsconfig#diagnostics"
                  },
                  "disableReferencedProjectLoad": {
                     "description": "减少TypeScript自动加载的项目数量。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "减少TypeScript自动加载的项目数量。\n\n查看更多: https://www.typescriptlang.org/tsconfig#disableReferencedProjectLoad"
                  },
                  "noPropertyAccessFromIndexSignature": {
                     "description": "强制对使用索引类型声明的键使用索引访问器",
                     "type": ["boolean", "null"],
                     "markdownDescription": "强制对使用索引类型声明的键使用索引访问器\n\n查看更多: https://www.typescriptlang.org/tsconfig#noPropertyAccessFromIndexSignature"
                  },
                  "emitBOM": {
                     "description": "在输出文件的开头发出UTF-8字节顺序标记(BOM)。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "在输出文件的开头发出UTF-8字节顺序标记(BOM)。\n\n查看更多: https://www.typescriptlang.org/tsconfig#emitBOM"
                  },
                  "emitDeclarationOnly": {
                     "description": "仅输出d.ts文件而不输出JavaScript文件。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "仅输出d.ts文件而不输出JavaScript文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#emitDeclarationOnly"
                  },
                  "erasableSyntaxOnly": {
                     "description": "不允许不属于ECMAScript的运行时构造。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "不允许不属于ECMAScript的运行时构造。\n\n查看更多: https://www.typescriptlang.org/tsconfig#erasableSyntaxOnly"
                  },
                  "exactOptionalPropertyTypes": {
                     "description": "在类型检查时区分undefined和不存在",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "在类型检查时区分undefined和不存在\n\n查看更多: https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes"
                  },
                  "incremental": {
                     "description": "启用增量编译。需要TypeScript 3.4或更高版本。",
                     "type": ["boolean", "null"]
                  },
                  "tsBuildInfoFile": {
                     "description": "指定.tsbuildinfo增量编译文件的文件夹。",
                     "default": ".tsbuildinfo",
                     "type": ["string", "null"],
                     "markdownDescription": "指定.tsbuildinfo增量编译文件的文件夹。\n\n查看更多: https://www.typescriptlang.org/tsconfig#tsBuildInfoFile"
                  },
                  "inlineSourceMap": {
                     "description": "在发出的JavaScript中包含源映射文件。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "在发出的JavaScript中包含源映射文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#inlineSourceMap"
                  },
                  "inlineSources": {
                     "description": "在发出的JavaScript中的源映射中包含源代码。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "在发出的JavaScript中的源映射中包含源代码。\n\n查看更多: https://www.typescriptlang.org/tsconfig#inlineSources"
                  },
                  "jsx": {
                     "description": "指定生成什么样的JSX代码。",
                     "enum": ["preserve", "react", "react-jsx", "react-jsxdev", "react-native"]
                  },
                  "reactNamespace": {
                     "description": "指定调用createElement的对象。这仅适用于针对react JSX发出时。",
                     "type": ["string", "null"],
                     "default": "React",
                     "markdownDescription": "指定调用createElement的对象。这仅适用于针对react JSX发出时。\n\n查看更多: https://www.typescriptlang.org/tsconfig#reactNamespace"
                  },
                  "jsxFactory": {
                     "description": "指定在针对React JSX发出时使用的JSX工厂函数，例如'React.createElement'或'h'",
                     "type": ["string", "null"],
                     "default": "React.createElement",
                     "markdownDescription": "指定在针对React JSX发出时使用的JSX工厂函数，例如'React.createElement'或'h'\n\n查看更多: https://www.typescriptlang.org/tsconfig#jsxFactory"
                  },
                  "jsxFragmentFactory": {
                     "description": "指定在针对React JSX发出时用于片段的JSX Fragment引用，例如'React.Fragment'或'Fragment'。",
                     "type": ["string", "null"],
                     "default": "React.Fragment",
                     "markdownDescription": "指定在针对React JSX发出时用于片段的JSX Fragment引用，例如'React.Fragment'或'Fragment'。\n\n查看更多: https://www.typescriptlang.org/tsconfig#jsxFragmentFactory"
                  },
                  "jsxImportSource": {
                     "description": "指定在使用jsx: react-jsx时用于导入JSX工厂函数的模块说明符。",
                     "type": ["string", "null"],
                     "default": "react",
                     "markdownDescription": "指定在使用jsx: react-jsx时用于导入JSX工厂函数的模块说明符。\n\n查看更多: https://www.typescriptlang.org/tsconfig#jsxImportSource"
                  },
                  "listFiles": {
                     "description": "打印编译期间读取的所有文件。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "打印编译期间读取的所有文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#listFiles"
                  },
                  "mapRoot": {
                     "description": "指定调试器应定位映射文件的位置，而不是生成的位置。",
                     "type": ["string", "null"],
                     "markdownDescription": "指定调试器应定位映射文件的位置，而不是生成的位置。\n\n查看更多: https://www.typescriptlang.org/tsconfig#mapRoot"
                  },
                  "module": {
                     "description": "指定生成什么样的模块代码。",
                     "type": ["string", "null"],
                     "anyOf": [
                        {
                           "enum": [
                              "commonjs",
                              "amd",
                              "system",
                              "umd",
                              "es6",
                              "es2015",
                              "es2020",
                              "esnext",
                              "none",
                              "es2022",
                              "node16",
                              "node18",
                              "node20",
                              "nodenext",
                              "preserve"
                           ]
                        },
                        {
                           "pattern": "^([Cc][Oo][Mm][Mm][Oo][Nn][Jj][Ss]|[AaUu][Mm][Dd]|[Ss][Yy][Ss][Tt][Ee][Mm]|[Ee][Ss]([356]|20(1[567]|2[02])|[Nn][Ee][Xx][Tt])|[Nn][Oo][dD][Ee]1[68]|[Nn][Oo][Dd][Ee][Nn][Ee][Xx][Tt]|[Nn][Oo][Nn][Ee]|[Pp][Rr][Ee][Ss][Ee][Rr][Vv][Ee])$"
                        }
                     ],
                     "markdownDescription": "指定生成什么样的模块代码。\n\n查看更多: https://www.typescriptlang.org/tsconfig#module"
                  },
                  "moduleResolution": {
                     "description": "指定TypeScript如何从给定的模块说明符查找文件。",
                     "type": ["string", "null"],
                     "anyOf": [
                        {
                           "enum": ["classic", "node", "node10", "node16", "nodenext", "bundler"],
                           "markdownEnumDescriptions": [
                              "建议改用\"node16\"",
                              "已弃用，在TypeScript 5.0+中使用\"node10\"代替",
                              "建议改用\"node16\"",
                              "这是库和Node.js应用程序的推荐设置",
                              "这是库和Node.js应用程序的推荐设置",
                              "这是TypeScript 5.0+中使用打包器的应用程序的推荐设置"
                           ]
                        },
                        {
                           "pattern": "^(([Nn]ode)|([Nn]ode1[06])|([Nn]ode[Nn]ext)|([Cc]lassic)|([Bb]undler))$"
                        }
                     ],
                     "markdownDescription": "指定TypeScript如何从给定的模块说明符查找文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#moduleResolution"
                  },
                  "newLine": {
                     "description": "设置发出文件的新行字符。",
                     "type": ["string", "null"],
                     "default": "lf",
                     "anyOf": [
                        {
                           "enum": ["crlf", "lf"]
                        },
                        {
                           "pattern": "^(CRLF|LF|crlf|lf)$"
                        }
                     ],
                     "markdownDescription": "设置发出文件的新行字符。\n\n查看更多: https://www.typescriptlang.org/tsconfig#newLine"
                  },
                  "noEmit": {
                     "description": "禁止从编译中发出文件。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁止从编译中发出文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noEmit"
                  },
                  "noEmitHelpers": {
                     "description": "禁止在编译输出中生成自定义辅助函数，如__extends。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁止在编译输出中生成自定义辅助函数，如__extends。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noEmitHelpers"
                  },
                  "noEmitOnError": {
                     "description": "如果报告了任何类型检查错误，则禁止发出文件。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "如果报告了任何类型检查错误，则禁止发出文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noEmitOnError"
                  },
                  "noImplicitAny": {
                     "description": "对具有隐式any类型的表达式和声明启用错误报告。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "对具有隐式any类型的表达式和声明启用错误报告。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noImplicitAny"
                  },
                  "noImplicitThis": {
                     "description": "当this被赋予any类型时启用错误报告。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "当this被赋予any类型时启用错误报告。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noImplicitThis"
                  },
                  "noUnusedLocals": {
                     "description": "当局部变量未被读取时启用错误报告。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "当局部变量未被读取时启用错误报告。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noUnusedLocals"
                  },
                  "noUnusedParameters": {
                     "description": "当函数参数未被读取时引发错误",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "当函数参数未被读取时引发错误\n\n查看更多: https://www.typescriptlang.org/tsconfig#noUnusedParameters"
                  },
                  "noLib": {
                     "description": "禁止包含任何库文件，包括默认的lib.d.ts。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁止包含任何库文件，包括默认的lib.d.ts。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noLib"
                  },
                  "noResolve": {
                     "description": "禁止import、require或<reference>扩展TypeScript应添加到项目中的文件数量。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁止import、require或<reference>扩展TypeScript应添加到项目中的文件数量。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noResolve"
                  },
                  "noStrictGenericChecks": {
                     "description": "禁用对函数类型中泛型签名的严格检查。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁用对函数类型中泛型签名的严格检查。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noStrictGenericChecks"
                  },
                  "out": {
                     "description": "已弃用。指定构建的输出。建议改用outFile。",
                     "type": ["string", "null"],
                     "markdownDescription": "指定构建的输出。建议改用outFile。\n\n查看更多: https://www.typescriptlang.org/tsconfig/#out"
                  },
                  "skipDefaultLibCheck": {
                     "description": "跳过对TypeScript附带的.d.ts文件的类型检查。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "跳过对TypeScript附带的.d.ts文件的类型检查。\n\n查看更多: https://www.typescriptlang.org/tsconfig#skipDefaultLibCheck"
                  },
                  "skipLibCheck": {
                     "description": "跳过对所有.d.ts文件的类型检查。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "跳过对所有.d.ts文件的类型检查。\n\n查看更多: https://www.typescriptlang.org/tsconfig#skipLibCheck"
                  },
                  "outFile": {
                     "description": "指定将所有输出捆绑到一个JavaScript文件中的文件。如果declaration为true，则还指定一个捆绑所有.d.ts输出的文件。",
                     "type": ["string", "null"],
                     "markdownDescription": "指定将所有输出捆绑到一个JavaScript文件中的文件。如果declaration为true，则还指定一个捆绑所有.d.ts输出的文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#outFile"
                  },
                  "outDir": {
                     "description": "指定所有发出文件的输出文件夹。",
                     "type": ["string", "null"],
                     "markdownDescription": "指定所有发出文件的输出文件夹。\n\n查看更多: https://www.typescriptlang.org/tsconfig#outDir"
                  },
                  "preserveConstEnums": {
                     "description": "禁止在生成的代码中擦除const enum声明。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁止在生成的代码中擦除const enum声明。\n\n查看更多: https://www.typescriptlang.org/tsconfig#preserveConstEnums"
                  },
                  "preserveSymlinks": {
                     "description": "禁止解析符号链接到它们的真实路径。这与node中的相同标志相关。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁止解析符号链接到它们的真实路径。这与node中的相同标志相关。\n\n查看更多: https://www.typescriptlang.org/tsconfig#preserveSymlinks"
                  },
                  "preserveValueImports": {
                     "description": "保留JavaScript输出中未使用的导入值，否则这些值将被移除",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "保留JavaScript输出中未使用的导入值，否则这些值将被移除\n\n查看更多: https://www.typescriptlang.org/tsconfig#preserveValueImports"
                  },
                  "preserveWatchOutput": {
                     "description": "禁止在监视模式下清除控制台",
                     "type": ["boolean", "null"],
                     "markdownDescription": "禁止在监视模式下清除控制台\n\n查看更多: https://www.typescriptlang.org/tsconfig#preserveWatchOutput"
                  },
                  "pretty": {
                     "description": "在输出中启用颜色和格式，使编译器错误更易于阅读",
                     "type": ["boolean", "null"],
                     "default": true,
                     "markdownDescription": "在输出中启用颜色和格式，使编译器错误更易于阅读\n\n查看更多: https://www.typescriptlang.org/tsconfig#pretty"
                  },
                  "removeComments": {
                     "description": "禁止发出注释。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁止发出注释。\n\n查看更多: https://www.typescriptlang.org/tsconfig#removeComments"
                  },
                  "rewriteRelativeImportExtensions": {
                     "description": "在输出文件中将相对导入路径中的'.ts'、'.tsx'、'.mts'和'.cts'文件扩展名重写为其JavaScript等效项。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "在输出文件中将相对导入路径中的'.ts'、'.tsx'、'.mts'和'.cts'文件扩展名重写为其JavaScript等效项。\n\n查看更多: https://www.typescriptlang.org/tsconfig#rewriteRelativeImportExtensions"
                  },
                  "rootDir": {
                     "description": "指定源文件中的根文件夹。",
                     "type": ["string", "null"],
                     "markdownDescription": "指定源文件中的根文件夹。\n\n查看更多: https://www.typescriptlang.org/tsconfig#rootDir"
                  },
                  "isolatedModules": {
                     "description": "确保每个文件可以安全地转译而不依赖于其他导入。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "确保每个文件可以安全地转译而不依赖于其他导入。\n\n查看更多: https://www.typescriptlang.org/tsconfig#isolatedModules"
                  },
                  "sourceMap": {
                     "description": "为发出的JavaScript文件创建源映射文件。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "为发出的JavaScript文件创建源映射文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#sourceMap"
                  },
                  "sourceRoot": {
                     "description": "指定调试器查找引用源代码的根路径。",
                     "type": ["string", "null"],
                     "markdownDescription": "指定调试器查找引用源代码的根路径。\n\n查看更多: https://www.typescriptlang.org/tsconfig#sourceRoot"
                  },
                  "suppressExcessPropertyErrors": {
                     "description": "禁止在创建对象字面量时报告多余属性错误。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁止在创建对象字面量时报告多余属性错误。\n\n查看更多: https://www.typescriptlang.org/tsconfig#suppressExcessPropertyErrors"
                  },
                  "suppressImplicitAnyIndexErrors": {
                     "description": "当索引缺少索引签名的对象时，禁止noImplicitAny错误。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "当索引缺少索引签名的对象时，禁止noImplicitAny错误。\n\n查看更多: https://www.typescriptlang.org/tsconfig#suppressImplicitAnyIndexErrors"
                  },
                  "stripInternal": {
                     "description": "禁止发出在其JSDoc注释中具有@internal的声明。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "禁止发出在其JSDoc注释中具有@internal的声明。\n\n查看更多: https://www.typescriptlang.org/tsconfig#stripInternal"
                  },
                  "target": {
                     "description": "设置发出的JavaScript的语言版本并包含兼容的库声明。",
                     "type": ["string", "null"],
                     "default": "es3",
                     "anyOf": [
                        {
                           "enum": [
                              "es3",
                              "es5",
                              "es6",
                              "es2015",
                              "es2016",
                              "es2017",
                              "es2018",
                              "es2019",
                              "es2020",
                              "es2021",
                              "es2022",
                              "es2023",
                              "es2024",
                              "esnext"
                           ]
                        },
                        {
                           "pattern": "^([Ee][Ss]([356]|(20(1[56789]|2[01234]))|[Nn][Ee][Xx][Tt]))$"
                        }
                     ],
                     "markdownDescription": "设置发出的JavaScript的语言版本并包含兼容的库声明。\n\n查看更多: https://www.typescriptlang.org/tsconfig#target"
                  },
                  "useUnknownInCatchVariables": {
                     "description": "将默认的catch子句变量设置为unknown而不是any。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "将默认的catch子句变量设置为unknown而不是any。\n\n查看更多: https://www.typescriptlang.org/tsconfig#useUnknownInCatchVariables"
                  },
                  "watch": {
                     "description": "监视输入文件。",
                     "type": ["boolean", "null"]
                  },
                  "fallbackPolling": {
                     "description": "指定当系统耗尽或不支持原生文件监视器时要使用的轮询策略。需要TypeScript 3.8或更高版本。",
                     "enum": [
                        "fixedPollingInterval",
                        "priorityPollingInterval",
                        "dynamicPriorityPolling",
                        "fixedInterval",
                        "priorityInterval",
                        "dynamicPriority",
                        "fixedChunkSize"
                     ]
                  },
                  "watchDirectory": {
                     "description": "指定在缺乏递归文件监视功能的系统上监视目录的策略。需要TypeScript 3.8或更高版本。",
                     "enum": [
                        "useFsEvents",
                        "fixedPollingInterval",
                        "dynamicPriorityPolling",
                        "fixedChunkSizePolling"
                     ],
                     "default": "useFsEvents"
                  },
                  "watchFile": {
                     "description": "指定监视单个文件的策略。需要TypeScript 3.8或更高版本。",
                     "enum": [
                        "fixedPollingInterval",
                        "priorityPollingInterval",
                        "dynamicPriorityPolling",
                        "useFsEvents",
                        "useFsEventsOnParentDirectory",
                        "fixedChunkSizePolling"
                     ],
                     "default": "useFsEvents"
                  },
                  "experimentalDecorators": {
                     "description": "启用对TC39阶段2草案装饰器的实验性支持。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "启用对TC39阶段2草案装饰器的实验性支持。\n\n查看更多: https://www.typescriptlang.org/tsconfig#experimentalDecorators"
                  },
                  "emitDecoratorMetadata": {
                     "description": "为源文件中的装饰声明发出设计类型元数据。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "为源文件中的装饰声明发出设计类型元数据。\n\n查看更多: https://www.typescriptlang.org/tsconfig#emitDecoratorMetadata"
                  },
                  "allowUnusedLabels": {
                     "description": "禁止对未使用的标签进行错误报告。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "禁止对未使用的标签进行错误报告。\n\n查看更多: https://www.typescriptlang.org/tsconfig#allowUnusedLabels"
                  },
                  "noImplicitReturns": {
                     "description": "对函数中未显式返回的代码路径启用错误报告。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "对函数中未显式返回的代码路径启用错误报告。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noImplicitReturns"
                  },
                  "noUncheckedIndexedAccess": {
                     "description": "在使用索引访问类型时添加undefined。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "在使用索引访问类型时添加undefined。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess"
                  },
                  "noFallthroughCasesInSwitch": {
                     "description": "对switch语句中的fallthrough情况启用错误报告。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "对switch语句中的fallthrough情况启用错误报告。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noFallthroughCasesInSwitch"
                  },
                  "noImplicitOverride": {
                     "description": "确保派生类中的覆盖成员标记有override修饰符。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "确保派生类中的覆盖成员标记有override修饰符。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noImplicitOverride"
                  },
                  "allowUnreachableCode": {
                     "description": "禁止对不可达代码进行错误报告。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "禁止对不可达代码进行错误报告。\n\n查看更多: https://www.typescriptlang.org/tsconfig#allowUnreachableCode"
                  },
                  "forceConsistentCasingInFileNames": {
                     "description": "确保导入中的大小写正确。",
                     "type": ["boolean", "null"],
                     "default": true,
                     "markdownDescription": "确保导入中的大小写正确。\n\n查看更多: https://www.typescriptlang.org/tsconfig#forceConsistentCasingInFileNames"
                  },
                  "generateCpuProfile": {
                     "description": "发出编译器运行的v8 CPU配置文件以进行调试。",
                     "type": ["string", "null"],
                     "default": "profile.cpuprofile",
                     "markdownDescription": "发出编译器运行的v8 CPU配置文件以进行调试。\n\n查看更多: https://www.typescriptlang.org/tsconfig#generateCpuProfile"
                  },
                  "baseUrl": {
                     "description": "指定解析非相对模块名称的基目录。",
                     "type": ["string", "null"],
                     "markdownDescription": "指定解析非相对模块名称的基目录。\n\n查看更多: https://www.typescriptlang.org/tsconfig#baseUrl"
                  },
                  "paths": {
                     "description": "指定一组将导入重新映射到其他查找位置的条目。",
                     "type": ["object", "null"],
                     "additionalProperties": {
                        "type": ["array", "null"],
                        "uniqueItems": true,
                        "items": {
                           "type": ["string", "null"],
                           "description": "相对于baseUrl选项计算的路径映射。"
                        }
                     },
                     "markdownDescription": "指定一组将导入重新映射到其他查找位置的条目。\n\n查看更多: https://www.typescriptlang.org/tsconfig#paths"
                  },
                  "plugins": {
                     "description": "指定要包含的语言服务插件列表。",
                     "type": ["array", "null"],
                     "items": {
                        "type": ["object", "null"],
                        "properties": {
                           "name": {
                              "description": "插件名称。",
                              "type": ["string", "null"]
                           }
                        }
                     },
                     "markdownDescription": "指定要包含的语言服务插件列表。\n\n查看更多: https://www.typescriptlang.org/tsconfig#plugins"
                  },
                  "rootDirs": {
                     "description": "允许在解析模块时将多个文件夹视为一个。",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": ["string", "null"]
                     },
                     "markdownDescription": "允许在解析模块时将多个文件夹视为一个。\n\n查看更多: https://www.typescriptlang.org/tsconfig#rootDirs"
                  },
                  "typeRoots": {
                     "description": "指定多个像./node_modules/@types一样工作的文件夹。",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": ["string", "null"]
                     },
                     "markdownDescription": "指定多个像./node_modules/@types一样工作的文件夹。\n\n查看更多: https://www.typescriptlang.org/tsconfig#typeRoots"
                  },
                  "types": {
                     "description": "指定要包含的类型包名称，而无需在源文件中引用。",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": ["string", "null"]
                     },
                     "markdownDescription": "指定要包含的类型包名称，而无需在源文件中引用。\n\n查看更多: https://www.typescriptlang.org/tsconfig#types"
                  },
                  "traceResolution": {
                     "description": "启用名称解析过程的跟踪。需要TypeScript 2.0或更高版本。",
                     "type": ["boolean", "null"],
                     "default": false
                  },
                  "allowJs": {
                     "description": "允许JavaScript文件成为程序的一部分。使用checkJS选项从这些文件中获取错误。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "允许JavaScript文件成为程序的一部分。使用checkJS选项从这些文件中获取错误。\n\n查看更多: https://www.typescriptlang.org/tsconfig#allowJs"
                  },
                  "noErrorTruncation": {
                     "description": "禁止在错误消息中截断类型。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁止在错误消息中截断类型。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noErrorTruncation"
                  },
                  "allowSyntheticDefaultImports": {
                     "description": "当模块没有默认导出时，允许'import x from y'。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "当模块没有默认导出时，允许'import x from y'。\n\n查看更多: https://www.typescriptlang.org/tsconfig#allowSyntheticDefaultImports"
                  },
                  "noImplicitUseStrict": {
                     "description": "禁止在发出的JavaScript文件中添加'use strict'指令。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁止在发出的JavaScript文件中添加'use strict'指令。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noImplicitUseStrict"
                  },
                  "listEmittedFiles": {
                     "description": "在编译后打印发出的文件的名称。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "在编译后打印发出的文件的名称。\n\n查看更多: https://www.typescriptlang.org/tsconfig#listEmittedFiles"
                  },
                  "disableSizeLimit": {
                     "description": "移除TypeScript语言服务器中JavaScript文件总源代码大小的20mb上限。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "移除TypeScript语言服务器中JavaScript文件总源代码大小的20mb上限。\n\n查看更多: https://www.typescriptlang.org/tsconfig#disableSizeLimit"
                  },
                  "lib": {
                     "description": "指定一组描述目标运行时环境的捆绑库声明文件。",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": ["string", "null"],
                        "anyOf": [
                           {
                              "enum": [
                                 "ES5",
                                 "ES6",
                                 "ES2015",
                                 "ES2015.Collection",
                                 "ES2015.Core",
                                 "ES2015.Generator",
                                 "ES2015.Iterable",
                                 "ES2015.Promise",
                                 "ES2015.Proxy",
                                 "ES2015.Reflect",
                                 "ES2015.Symbol.WellKnown",
                                 "ES2015.Symbol",
                                 "ES2016",
                                 "ES2016.Array.Include",
                                 "ES2017",
                                 "ES2017.Intl",
                                 "ES2017.Object",
                                 "ES2017.SharedMemory",
                                 "ES2017.String",
                                 "ES2017.TypedArrays",
                                 "ES2017.ArrayBuffer",
                                 "ES2018",
                                 "ES2018.AsyncGenerator",
                                 "ES2018.AsyncIterable",
                                 "ES2018.Intl",
                                 "ES2018.Promise",
                                 "ES2018.Regexp",
                                 "ES2019",
                                 "ES2019.Array",
                                 "ES2019.Intl",
                                 "ES2019.Object",
                                 "ES2019.String",
                                 "ES2019.Symbol",
                                 "ES2020",
                                 "ES2020.BigInt",
                                 "ES2020.Promise",
                                 "ES2020.String",
                                 "ES2020.Symbol.WellKnown",
                                 "ESNext",
                                 "ESNext.Array",
                                 "ESNext.AsyncIterable",
                                 "ESNext.BigInt",
                                 "ESNext.Collection",
                                 "ESNext.Intl",
                                 "ESNext.Iterator",
                                 "ESNext.Object",
                                 "ESNext.Promise",
                                 "ESNext.Regexp",
                                 "ESNext.String",
                                 "ESNext.Symbol",
                                 "DOM",
                                 "DOM.AsyncIterable",
                                 "DOM.Iterable",
                                 "ScriptHost",
                                 "WebWorker",
                                 "WebWorker.AsyncIterable",
                                 "WebWorker.ImportScripts",
                                 "Webworker.Iterable",
                                 "ES7",
                                 "ES2021",
                                 "ES2020.SharedMemory",
                                 "ES2020.Intl",
                                 "ES2020.Date",
                                 "ES2020.Number",
                                 "ES2021.Promise",
                                 "ES2021.String",
                                 "ES2021.WeakRef",
                                 "ESNext.WeakRef",
                                 "ES2021.Intl",
                                 "ES2022",
                                 "ES2022.Array",
                                 "ES2022.Error",
                                 "ES2022.Intl",
                                 "ES2022.Object",
                                 "ES2022.String",
                                 "ES2022.SharedMemory",
                                 "ES2022.RegExp",
                                 "ES2023",
                                 "ES2023.Array",
                                 "ES2024",
                                 "ES2024.ArrayBuffer",
                                 "ES2024.Collection",
                                 "ES2024.Object",
                                 "ES2024.Promise",
                                 "ES2024.Regexp",
                                 "ES2024.SharedMemory",
                                 "ES2024.String",
                                 "Decorators",
                                 "Decorators.Legacy",
                                 "ES2017.Date",
                                 "ES2023.Collection",
                                 "ESNext.Decorators",
                                 "ESNext.Disposable",
                                 "ESNext.Error",
                                 "ESNext.Sharedmemory"
                              ]
                           },
                           {
                              "pattern": "^[Ee][Ss]5|[Ee][Ss]6|[Ee][Ss]7$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2015(\\.([Cc][Oo][Ll][Ll][Ee][Cc][Tt][Ii][Oo][Nn]|[Cc][Oo][Rr][Ee]|[Gg][Ee][Nn][Ee][Rr][Aa][Tt][Oo][Rr]|[Ii][Tt][Ee][Rr][Aa][Bb][Ll][Ee]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Pp][Rr][Oo][Xx][Yy]|[Rr][Ee][Ff][Ll][Ee][Cc][Tt]|[Ss][Yy][Mm][Bb][Oo][Ll]\\.[Ww][Ee][Ll][Ll][Kk][Nn][Oo][Ww][Nn]|[Ss][Yy][Mm][Bb][Oo][Ll]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2016(\\.[Aa][Rr][Rr][Aa][Yy]\\.[Ii][Nn][Cc][Ll][Uu][Dd][Ee])?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2017(\\.([Ii][Nn][Tt][Ll]|[Oo][Bb][Jj][Ee][Cc][Tt]|[Ss][Hh][Aa][Rr][Ee][Dd][Mm][Ee][Mm][Oo][Rr][Yy]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Tt][Yy][Pp][Ee][Dd][Aa][Rr][Rr][Aa][Yy][Ss]|[Dd][Aa][Tt][Ee]|[Aa][Rr][Rr][Aa][Yy][Bb][Uu][Ff][Ff][Ee][Rr]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2018(\\.([Aa][Ss][Yy][Nn][Cc][Gg][Ee][Nn][Ee][Rr][Aa][Tt][Oo][Rr]|[Aa][Ss][Yy][Nn][Cc][Ii][Tt][Ee][Rr][Aa][Bb][Ll][Ee]|[Ii][Nn][Tt][Ll]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Rr][Ee][Gg][Ee][Xx][Pp]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2019(\\.([Aa][Rr][Rr][Aa][Yy]|[Ii][Nn][Tt][Ll]|[Oo][Bb][Jj][Ee][Cc][Tt]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Ss][Yy][Mm][Bb][Oo][Ll]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2020(\\.([Bb][Ii][Gg][Ii][Nn][Tt]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Ss][Yy][Mm][Bb][Oo][Ll]\\.[Ww][Ee][Ll][Ll][Kk][Nn][Oo][Ww][Nn]|[Ss][Hh][Aa][Rr][Ee][Dd][Mm][Ee][Mm][Oo][Rr][Yy]|[Ii][Nn][Tt][Ll]|[Dd][Aa][Tt][Ee]|[Nn][Uu][Mm][Bb][Ee][Rr]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2021(\\.([Ii][Nn][Tt][Ll]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Ww][Ee][Aa][Kk][Rr][Ee][Ff]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2022(\\.([Aa][Rr][Rr][Aa][Yy]|[Ee][Rr][Rr][Oo][Rr]|[Ii][Nn][Tt][Ll]|[Oo][Bb][Jj][Ee][Cc][Tt]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Ss][Hh][Aa][Rr][Ee][Dd][Mm][Ee][Mm][Oo][Rr][Yy]|[Rr][Ee][Gg][Ee][Xx][Pp]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2023(\\.([Aa][Rr][Rr][Aa][Yy]|[Cc][Oo][Ll][Ll][Ee][Cc][Tt][Ii][Oo][Nn]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2024(\\.([Aa][Rr][Rr][Aa][Yy][Bb][Uu][Ff][Ff][Ee][Rr]|[Cc][Oo][Ll][Ll][Ee][Cc][Tt][Ii][Oo][Nn]|[Oo][Bb][Jj][Ee][Cc][Tt]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Rr][Ee][Gg][Ee][Xx][Pp]|[Ss][Hh][Aa][Rr][Ee][Dd][Mm][Ee][Mm][Oo][Rr][Yy]|[Ss][Tt][Rr][Ii][Nn][Gg]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss][Nn][Ee][Xx][Tt](\\.([Aa][Rr][Rr][Aa][Yy]|[Aa][Ss][Yy][Nn][Cc][Ii][Tt][Ee][Rr][Aa][Bb][Ll][Ee]|[Bb][Ii][Gg][Ii][Nn][Tt]|[Ii][Nn][Tt][Ll]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Ss][Yy][Mm][Bb][Oo][Ll]|[Ww][Ee][Aa][Kk][Rr][Ee][Ff]|[Dd][Ee][Cc][Oo][Rr][Aa][Tt][Oo][Rr][Ss]|[Dd][Ii][Ss][Pp][Oo][Ss][Aa][Bb][Ll][Ee]))?$"
                           },
                           {
                              "pattern": "^[Dd][Oo][Mm](\\.([Aa][Ss][Yy][Nn][Cc])?[Ii][Tt][Ee][Rr][Aa][Bb][Ll][Ee])?$"
                           },
                           {
                              "pattern": "^[Ss][Cc][Rr][Ii][Pp][Tt][Hh][Oo][Ss][Tt]$"
                           },
                           {
                              "pattern": "^[Ww][Ee][Bb][Ww][Oo][Rr][Kk][Ee][Rr](\\.([Ii][Mm][Pp][Oo][Rr][Tt][Ss][Cc][Rr][Ii][Pp][Tt][Ss]|([Aa][Ss][Yy][Nn][Cc])?[Ii][Tt][Ee][Rr][Aa][Bb][Ll][Ee]))?$"
                           },
                           {
                              "pattern": "^[Dd][Ee][Cc][Oo][Rr][Aa][Tt][Oo][Rr][Ss](\\.([Ll][Ee][Gg][Aa][Cc][Yy]))?$"
                           }
                        ]
                     },
                     "markdownDescription": "指定一组描述目标运行时环境的捆绑库声明文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#lib"
                  },
                  "libReplacement": {
                     "description": "启用lib替换。",
                     "type": ["boolean", "null"],
                     "default": true,
                     "markdownDescription": "启用lib替换。\n\n查看更多: https://www.typescriptlang.org/tsconfig#libReplacement"
                  },
                  "moduleDetection": {
                     "description": "指定TypeScript如何确定文件为模块。",
                     "enum": ["auto", "legacy", "force"]
                  },
                  "strictNullChecks": {
                     "description": "在类型检查时考虑null和undefined。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "在类型检查时考虑null和undefined。\n\n查看更多: https://www.typescriptlang.org/tsconfig#strictNullChecks"
                  },
                  "maxNodeModuleJsDepth": {
                     "description": "指定用于检查来自node_modules的JavaScript文件的最大文件夹深度。仅适用于allowJs。",
                     "type": ["number", "null"],
                     "default": 0,
                     "markdownDescription": "指定用于检查来自node_modules的JavaScript文件的最大文件夹深度。仅适用于allowJs。\n\n查看更多: https://www.typescriptlang.org/tsconfig#maxNodeModuleJsDepth"
                  },
                  "importHelpers": {
                     "description": "允许从tslib一次导入辅助函数，而不是每个文件都包含它们。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "允许从tslib一次导入辅助函数，而不是每个文件都包含它们。\n\n查看更多: https://www.typescriptlang.org/tsconfig#importHelpers"
                  },
                  "importsNotUsedAsValues": {
                     "description": "指定仅用于类型的导入的发出/检查行为。",
                     "default": "remove",
                     "enum": ["remove", "preserve", "error"]
                  },
                  "alwaysStrict": {
                     "description": "确保始终发出'use strict'。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "确保始终发出'use strict'。\n\n查看更多: https://www.typescriptlang.org/tsconfig#alwaysStrict"
                  },
                  "strict": {
                     "description": "启用所有严格类型检查选项。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "启用所有严格类型检查选项。\n\n查看更多: https://www.typescriptlang.org/tsconfig#strict"
                  },
                  "strictBindCallApply": {
                     "description": "检查bind、call和apply方法的参数是否与原始函数匹配。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "检查bind、call和apply方法的参数是否与原始函数匹配。\n\n查看更多: https://www.typescriptlang.org/tsconfig#strictBindCallApply"
                  },
                  "downlevelIteration": {
                     "description": "为迭代发出更合规但冗长且性能较低的JavaScript。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "为迭代发出更合规但冗长且性能较低的JavaScript。\n\n查看更多: https://www.typescriptlang.org/tsconfig#downlevelIteration"
                  },
                  "checkJs": {
                     "description": "在类型检查的JavaScript文件中启用错误报告。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "在类型检查的JavaScript文件中启用错误报告。\n\n查看更多: https://www.typescriptlang.org/tsconfig#checkJs"
                  },
                  "strictFunctionTypes": {
                     "description": "在分配函数时，检查以确保参数和返回值是子类型兼容的。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "在分配函数时，检查以确保参数和返回值是子类型兼容的。\n\n查看更多: https://www.typescriptlang.org/tsconfig#strictFunctionTypes"
                  },
                  "strictPropertyInitialization": {
                     "description": "检查在构造函数中声明但未设置的类属性。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "检查在构造函数中声明但未设置的类属性。\n\n查看更多: https://www.typescriptlang.org/tsconfig#strictPropertyInitialization"
                  },
                  "esModuleInterop": {
                     "description": "发出额外的JavaScript以简化对导入CommonJS模块的支持。这为类型兼容性启用了allowSyntheticDefaultImports。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "发出额外的JavaScript以简化对导入CommonJS模块的支持。这为类型兼容性启用了allowSyntheticDefaultImports。\n\n查看更多: https://www.typescriptlang.org/tsconfig#esModuleInterop"
                  },
                  "allowUmdGlobalAccess": {
                     "description": "允许从模块访问UMD全局变量。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "允许从模块访问UMD全局变量。\n\n查看更多: https://www.typescriptlang.org/tsconfig#allowUmdGlobalAccess"
                  },
                  "keyofStringsOnly": {
                     "description": "使keyof仅返回字符串而不是字符串、数字或符号。遗留选项。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "使keyof仅返回字符串而不是字符串、数字或符号。遗留选项。\n\n查看更多: https://www.typescriptlang.org/tsconfig#keyofStringsOnly"
                  },
                  "useDefineForClassFields": {
                     "description": "发出符合ECMAScript标准的类字段。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "发出符合ECMAScript标准的类字段。\n\n查看更多: https://www.typescriptlang.org/tsconfig#useDefineForClassFields"
                  },
                  "declarationMap": {
                     "description": "为d.ts文件创建源映射。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "为d.ts文件创建源映射。\n\n查看更多: https://www.typescriptlang.org/tsconfig#declarationMap"
                  },
                  "resolveJsonModule": {
                     "description": "启用导入.json文件",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "启用导入.json文件\n\n查看更多: https://www.typescriptlang.org/tsconfig#resolveJsonModule"
                  },
                  "resolvePackageJsonExports": {
                     "description": "解析包导入时使用package.json的'exports'字段。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "解析包导入时使用package.json的'exports'字段。\n\n查看更多: https://www.typescriptlang.org/tsconfig#resolvePackageJsonExports"
                  },
                  "resolvePackageJsonImports": {
                     "description": "解析导入时使用package.json的'imports'字段。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "解析导入时使用package.json的'imports'字段。\n\n查看更多: https://www.typescriptlang.org/tsconfig#resolvePackageJsonImports"
                  },
                  "assumeChangesOnlyAffectDirectDependencies": {
                     "description": "在'--incremental'和'--watch'中，假设文件中的更改只会影响直接依赖它的文件。需要TypeScript 3.8或更高版本。",
                     "type": ["boolean", "null"]
                  },
                  "extendedDiagnostics": {
                     "description": "构建后输出更详细的编译器性能信息。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "构建后输出更详细的编译器性能信息。\n\n查看更多: https://www.typescriptlang.org/tsconfig#extendedDiagnostics"
                  },
                  "listFilesOnly": {
                     "description": "打印属于编译部分的文件名，然后停止处理。",
                     "type": ["boolean", "null"]
                  },
                  "disableSourceOfProjectReferenceRedirect": {
                     "description": "禁用引用复合项目时优先使用源文件而不是声明文件",
                     "type": ["boolean", "null"],
                     "markdownDescription": "禁用引用复合项目时优先使用源文件而不是声明文件\n\n查看更多: https://www.typescriptlang.org/tsconfig#disableSourceOfProjectReferenceRedirect"
                  },
                  "disableSolutionSearching": {
                     "description": "在编辑时选择项目退出多项目引用检查。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "在编辑时选择项目退出多项目引用检查。\n\n查看更多: https://www.typescriptlang.org/tsconfig#disableSolutionSearching"
                  },
                  "verbatimModuleSyntax": {
                     "description": "不转换或省略任何未标记为仅类型的导入或导出，确保它们根据'module'设置以输出文件的格式写入。",
                     "type": ["boolean", "null"],
                     "markdownDescription": "不转换或省略任何未标记为仅类型的导入或导出，确保它们根据'module'设置以输出文件的格式写入。\n\n查看更多: https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax"
                  },
                  "noCheck": {
                     "description": "禁用完整类型检查(仅报告关键解析和发出错误)",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "禁用完整类型检查(仅报告关键解析和发出错误)\n\n查看更多: https://www.typescriptlang.org/tsconfig#noCheck"
                  },
                  "isolatedDeclarations": {
                     "description": "要求对导出进行足够的注释，以便其他工具可以轻松生成声明文件。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "要求对导出进行足够的注释，以便其他工具可以轻松生成声明文件。\n\n查看更多: https://www.typescriptlang.org/tsconfig#isolatedDeclarations"
                  },
                  "noUncheckedSideEffectImports": {
                     "description": "检查副作用导入。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "检查副作用导入。\n\n查看更多: https://www.typescriptlang.org/tsconfig#noUncheckedSideEffectImports"
                  },
                  "strictBuiltinIteratorReturn": {
                     "description": "内置迭代器实例化时使用'TReturn'类型为'undefined'而不是'any'。",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "内置迭代器实例化时使用'TReturn'类型为'undefined'而不是'any'。\n\n查看更多: https://www.typescriptlang.org/tsconfig#strictBuiltinIteratorReturn"
                  }
               }
            }
         }
      },
      "typeAcquisitionDefinition": {
         "properties": {
            "typeAcquisition": {
               "type": ["object", "null"],
               "description": "此项目的自动类型(.d.ts)获取选项。需要TypeScript 2.1或更高版本。",
               "properties": {
                  "enable": {
                     "description": "启用自动类型获取",
                     "type": ["boolean", "null"],
                     "default": false
                  },
                  "include": {
                     "description": "指定要包含在自动类型获取中的类型声明列表。例如[\"jquery\", \"lodash\"]",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": ["string", "null"]
                     }
                  },
                  "exclude": {
                     "description": "指定要从自动类型获取中排除的类型声明列表。例如[\"jquery\", \"lodash\"]",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": ["string", "null"]
                     }
                  }
               }
            }
         }
      },
      "referencesDefinition": {
         "properties": {
            "references": {
               "type": ["array", "null"],
               "uniqueItems": true,
               "description": "引用的项目。需要TypeScript 3.0或更高版本。",
               "items": {
                  "type": ["object", "null"],
                  "description": "项目引用。",
                  "properties": {
                     "path": {
                        "type": ["string", "null"],
                        "description": "引用的tsconfig路径或包含tsconfig的文件夹路径。"
                     }
                  }
               }
            }
         }
      },
      "tsNodeModuleTypes": {
         "type": ["object", "null"]
      },
      "tsNodeDefinition": {
         "properties": {
            "ts-node": {
               "description": "ts-node选项。另请参阅: https://typestrong.org/ts-node/docs/configuration\n\nts-node为node.js提供TypeScript执行和REPL，支持源映射。",
               "properties": {
                  "compiler": {
                     "default": "typescript",
                     "description": "指定自定义TypeScript编译器。",
                     "type": ["string", "null"]
                  },
                  "compilerHost": {
                     "default": false,
                     "description": "使用TypeScript的编译器主机API而不是语言服务API。",
                     "type": ["boolean", "null"]
                  },
                  "compilerOptions": {
                     "additionalProperties": true,
                     "allOf": [
                        {
                           "$ref": "#/definitions/compilerOptionsDefinition/properties/compilerOptions"
                        }
                     ],
                     "description": "与TypeScript compilerOptions合并的JSON对象。",
                     "properties": {},
                     "type": ["object", "null"]
                  },
                  "emit": {
                     "default": false,
                     "description": "将输出文件发出到.ts-node目录中。",
                     "type": ["boolean", "null"]
                  },
                  "esm": {
                     "description": "启用原生ESM支持。\n\n详情请见 https://typestrong.org/ts-node/docs/imports#native-ecmascript-modules",
                     "type": ["boolean", "null"]
                  },
                  "experimentalReplAwait": {
                     "description": "允许在REPL中使用顶层await。\n\n使用node的实现，通过AST语法转换实现。\n\n当tsconfig目标为es2018或更高时默认启用。设置为false以禁用。\n\n注意: 当tsconfig目标过低时设置为true会抛出错误。保留为undefined以获得默认的自动行为。",
                     "type": ["boolean", "null"]
                  },
                  "experimentalResolver": {
                     "description": "启用实验性功能，重新映射导入和require调用以支持:\nbaseUrl、paths、rootDirs、.js到.ts文件扩展名映射、\noutDir到rootDir映射用于复合项目和monorepos。\n\n详情请见 https://github.com/TypeStrong/ts-node/issues/1514",
                     "type": ["boolean", "null"]
                  },
                  "experimentalSpecifierResolution": {
                     "description": "类似于node的--experimental-specifier-resolution，但也可以在tsconfig.json中设置以便使用。\n\n详情请见 https://nodejs.org/dist/latest-v18.x/docs/api/esm.html#customizing-esm-specifier-resolution-algorithm",
                     "enum": ["explicit", "node"],
                     "type": ["string", "null"]
                  },
                  "files": {
                     "default": false,
                     "description": "启动时从tsconfig.json加载\"files\"和\"include\"。\n\n默认是覆盖tsconfig.json的\"files\"和\"include\"，仅包含入口脚本。",
                     "type": ["boolean", "null"]
                  },
                  "ignore": {
                     "default": ["(?:^|/)node_modules/"],
                     "description": "不应编译的路径。\n\n数组中的每个字符串通过new RegExp()转换为正则表达式，并在编译前针对源路径进行测试。\n\n源路径被规范化为posix风格的分隔符，相对于包含tsconfig.json的目录，如果没有加载tsconfig.json则相对于cwd。\n\n默认是忽略所有node_modules子目录。",
                     "items": {
                        "type": ["string", "null"]
                     },
                     "type": ["array", "null"]
                  },
                  "ignoreDiagnostics": {
                     "description": "按诊断代码忽略TypeScript警告。",
                     "items": {
                        "type": ["string", "number"]
                     },
                     "type": ["array", "null"]
                  },
                  "logError": {
                     "default": false,
                     "description": "将TypeScript错误记录到stderr而不是抛出异常。",
                     "type": ["boolean", "null"]
                  },
                  "moduleTypes": {
                     "$ref": "#/definitions/tsNodeModuleTypes",
                     "description": "覆盖某些路径以作为CommonJS或ECMAScript模块编译和执行。\n当覆盖时，tsconfig的\"module\"和package.json的\"type\"字段会被覆盖，\n文件扩展名会被忽略。\n这在无法使用.mts、.cts、.mjs或.cjs文件扩展名时很有用；\n它实现了相同的效果。\n\n每个键都是遵循与tsconfig的\"include\"数组相同规则的glob模式。\n当多个模式匹配同一个文件时，最后一个模式优先。\n\ncjs覆盖匹配文件以作为CommonJS编译和执行。\nesm覆盖匹配文件以作为原生ECMAScript模块编译和执行。\npackage覆盖上述任一行为为默认行为，即遵守package.json的\"type\"和\ntsconfig.json的\"module\"选项。"
                  },
                  "preferTsExts": {
                     "default": false,
                     "description": "重新排序文件扩展名，使TypeScript导入优先。\n\n例如，当同时存在index.js和index.ts时，启用此选项会导致require('./index')解析为index.ts而不是index.js",
                     "type": ["boolean", "null"]
                  },
                  "pretty": {
                     "default": false,
                     "description": "使用漂亮的诊断格式化程序。",
                     "type": ["boolean", "null"]
                  },
                  "require": {
                     "description": "需要加载的模块，类似于node的--require标志。\n\n如果在tsconfig.json中指定，模块将相对于tsconfig.json文件解析。\n\n如果以编程方式指定，每个输入字符串应预先解析为绝对路径以获得最佳结果。",
                     "items": {
                        "type": ["string", "null"]
                     },
                     "type": ["array", "null"]
                  },
                  "scope": {
                     "default": false,
                     "description": "将编译器范围限定在scopeDir内的文件。",
                     "type": ["boolean", "null"]
                  },
                  "scopeDir": {
                     "default": "首先使用：如果指定了tsconfig.json的\"rootDir\"，则使用包含tsconfig.json的目录，如果没有加载tsconfig.json则使用cwd。",
                     "type": ["string", "null"]
                  },
                  "skipIgnore": {
                     "default": false,
                     "description": "跳过忽略检查，以便尝试编译所有具有匹配扩展名的文件。",
                     "type": ["boolean", "null"]
                  },
                  "swc": {
                     "description": "使用swc而不是TypeScript编译器进行转译，并跳过类型检查。\n\n等同于同时设置transpileOnly: true和transpiler: 'ts-node/transpilers/swc'\n\n完整说明：https://typestrong.org/ts-node/docs/transpilers",
                     "type": ["boolean", "null"]
                  },
                  "transpileOnly": {
                     "default": false,
                     "description": "使用TypeScript更快的transpileModule。",
                     "type": ["boolean", "null"]
                  },
                  "transpiler": {
                     "anyOf": [
                        {
                           "items": [
                              {
                                 "type": ["string", "null"]
                              },
                              {
                                 "additionalProperties": true,
                                 "properties": {},
                                 "type": ["object", "null"]
                              }
                           ],
                           "maxItems": 2,
                           "minItems": 2,
                           "type": ["array", "null"]
                        },
                        {
                           "type": ["string", "null"]
                        }
                     ],
                     "description": "为transpileOnly指定自定义转译器"
                  },
                  "typeCheck": {
                     "default": true,
                     "description": "已弃用 指定是否启用类型检查(例如transpileOnly == false)。",
                     "type": ["boolean", "null"]
                  }
               },
               "type": ["object", "null"]
            }
         }
      }
   },
   "id": "https://json.schemastore.org/tsconfig",
   "title": "TypeScript编译器配置文件的JSON模式",
   "type": "object"
}
```

:::

## 英文版

<Tip title="提示">

"$schema": "https://json.schemastore.org/tsconfig.json"

如果网络不好访问不到，就手动下载然后放到项目中，适合网络不好的情况。或者复制下面即可。
</Tip>

::: code-group

```json [schema.json]
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "$comment": "Note that this schema uses 'null' in various places. The value of 'null' is UNDOCUMENTED (https://github.com/microsoft/TypeScript/pull/18058)",
   "allowTrailingCommas": true,
   "allOf": [
      {
         "$ref": "#/definitions/compilerOptionsDefinition"
      },
      {
         "$ref": "#/definitions/compileOnSaveDefinition"
      },
      {
         "$ref": "#/definitions/typeAcquisitionDefinition"
      },
      {
         "$ref": "#/definitions/extendsDefinition"
      },
      {
         "$ref": "#/definitions/watchOptionsDefinition"
      },
      {
         "$ref": "#/definitions/buildOptionsDefinition"
      },
      {
         "$ref": "#/definitions/tsNodeDefinition"
      },
      {
         "anyOf": [
            {
               "$ref": "#/definitions/filesDefinition"
            },
            {
               "$ref": "#/definitions/excludeDefinition"
            },
            {
               "$ref": "#/definitions/includeDefinition"
            },
            {
               "$ref": "#/definitions/referencesDefinition"
            }
         ]
      }
   ],
   "definitions": {
      "//": {
         "explainer": "https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#overview",
         "reference": "https://www.typescriptlang.org/tsconfig",
         "reference metadata": "https://github.com/microsoft/TypeScript-Website/blob/v2/packages/tsconfig-reference/scripts/tsconfigRules.ts"
      },
      "filesDefinition": {
         "properties": {
            "files": {
               "description": "If no 'files' or 'include' property is present in a tsconfig.json, the compiler defaults to including all files in the containing directory and subdirectories except those specified by 'exclude'. When a 'files' property is specified, only those files and those specified by 'include' are included.",
               "type": ["array", "null"],
               "uniqueItems": true,
               "items": {
                  "type": "string"
               }
            }
         }
      },
      "excludeDefinition": {
         "properties": {
            "exclude": {
               "description": "Specifies a list of files to be excluded from compilation. The 'exclude' property only affects the files included via the 'include' property and not the 'files' property. Glob patterns require TypeScript version 2.0 or later.",
               "type": ["array", "null"],
               "uniqueItems": true,
               "items": {
                  "type": "string"
               }
            }
         }
      },
      "includeDefinition": {
         "properties": {
            "include": {
               "description": "Specifies a list of glob patterns that match files to be included in compilation. If no 'files' or 'include' property is present in a tsconfig.json, the compiler defaults to including all files in the containing directory and subdirectories except those specified by 'exclude'. Requires TypeScript version 2.0 or later.",
               "type": ["array", "null"],
               "uniqueItems": true,
               "items": {
                  "type": "string"
               }
            }
         }
      },
      "compileOnSaveDefinition": {
         "properties": {
            "compileOnSave": {
               "description": "Enable Compile-on-Save for this project.",
               "type": ["boolean", "null"]
            }
         }
      },
      "extendsDefinition": {
         "properties": {
            "extends": {
               "description": "Path to base configuration file to inherit from (requires TypeScript version 2.1 or later), or array of base files, with the rightmost files having the greater priority (requires TypeScript version 5.0 or later).",
               "oneOf": [
                  {
                     "default": "",
                     "type": "string"
                  },
                  {
                     "default": [],
                     "items": {
                        "type": "string"
                     },
                     "type": "array"
                  }
               ]
            }
         }
      },
      "buildOptionsDefinition": {
         "properties": {
            "buildOptions": {
               "properties": {
                  "dry": {
                     "description": "~",
                     "type": ["boolean", "null"],
                     "default": false
                  },
                  "force": {
                     "description": "Build all projects, including those that appear to be up to date",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Build all projects, including those that appear to be up to date\n\nSee more: https://www.typescriptlang.org/tsconfig#force"
                  },
                  "verbose": {
                     "description": "Enable verbose logging",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Enable verbose logging\n\nSee more: https://www.typescriptlang.org/tsconfig#verbose"
                  },
                  "incremental": {
                     "description": "Save .tsbuildinfo files to allow for incremental compilation of projects.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Save .tsbuildinfo files to allow for incremental compilation of projects.\n\nSee more: https://www.typescriptlang.org/tsconfig#incremental"
                  },
                  "assumeChangesOnlyAffectDirectDependencies": {
                     "description": "Have recompiles in projects that use `incremental` and `watch` mode assume that changes within a file will only affect files directly depending on it.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Have recompiles in projects that use `incremental` and `watch` mode assume that changes within a file will only affect files directly depending on it.\n\nSee more: https://www.typescriptlang.org/tsconfig#assumeChangesOnlyAffectDirectDependencies"
                  },
                  "traceResolution": {
                     "description": "Log paths used during the `moduleResolution` process.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Log paths used during the `moduleResolution` process.\n\nSee more: https://www.typescriptlang.org/tsconfig#traceResolution"
                  }
               }
            }
         }
      },
      "watchOptionsDefinition": {
         "properties": {
            "watchOptions": {
               "type": ["object", "null"],
               "description": "Settings for the watch mode in TypeScript.",
               "properties": {
                  "force": {
                     "description": "~",
                     "type": ["string", "null"]
                  },
                  "watchFile": {
                     "description": "Specify how the TypeScript watch mode works.",
                     "type": ["string", "null"],
                     "markdownDescription": "Specify how the TypeScript watch mode works.\n\nSee more: https://www.typescriptlang.org/tsconfig#watchFile"
                  },
                  "watchDirectory": {
                     "description": "Specify how directories are watched on systems that lack recursive file-watching functionality.",
                     "type": ["string", "null"],
                     "markdownDescription": "Specify how directories are watched on systems that lack recursive file-watching functionality.\n\nSee more: https://www.typescriptlang.org/tsconfig#watchDirectory"
                  },
                  "fallbackPolling": {
                     "description": "Specify what approach the watcher should use if the system runs out of native file watchers.",
                     "type": ["string", "null"],
                     "markdownDescription": "Specify what approach the watcher should use if the system runs out of native file watchers.\n\nSee more: https://www.typescriptlang.org/tsconfig#fallbackPolling"
                  },
                  "synchronousWatchDirectory": {
                     "description": "Synchronously call callbacks and update the state of directory watchers on platforms that don`t support recursive watching natively.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Synchronously call callbacks and update the state of directory watchers on platforms that don`t support recursive watching natively.\n\nSee more: https://www.typescriptlang.org/tsconfig#synchronousWatchDirectory"
                  },
                  "excludeFiles": {
                     "description": "Remove a list of files from the watch mode's processing.",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": "string"
                     },
                     "markdownDescription": "Remove a list of files from the watch mode's processing.\n\nSee more: https://www.typescriptlang.org/tsconfig#excludeFiles"
                  },
                  "excludeDirectories": {
                     "description": "Remove a list of directories from the watch process.",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": "string"
                     },
                     "markdownDescription": "Remove a list of directories from the watch process.\n\nSee more: https://www.typescriptlang.org/tsconfig#excludeDirectories"
                  }
               }
            }
         }
      },
      "compilerOptionsDefinition": {
         "properties": {
            "compilerOptions": {
               "type": ["object", "null"],
               "description": "Instructs the TypeScript compiler how to compile .ts files.",
               "properties": {
                  "allowArbitraryExtensions": {
                     "description": "Enable importing files with any extension, provided a declaration file is present.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Enable importing files with any extension, provided a declaration file is present.\n\nSee more: https://www.typescriptlang.org/tsconfig#allowArbitraryExtensions"
                  },
                  "allowImportingTsExtensions": {
                     "description": "Allow imports to include TypeScript file extensions. Requires `--moduleResolution bundler` and either `--noEmit` or `--emitDeclarationOnly` to be set.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Allow imports to include TypeScript file extensions. Requires `--moduleResolution bundler` and either `--noEmit` or `--emitDeclarationOnly` to be set.\n\nSee more: https://www.typescriptlang.org/tsconfig#allowImportingTsExtensions"
                  },
                  "charset": {
                     "description": "No longer supported. In early versions, manually set the text encoding for reading files.",
                     "type": ["string", "null"],
                     "markdownDescription": "No longer supported. In early versions, manually set the text encoding for reading files.\n\nSee more: https://www.typescriptlang.org/tsconfig#charset"
                  },
                  "composite": {
                     "description": "Enable constraints that allow a TypeScript project to be used with project references.",
                     "type": ["boolean", "null"],
                     "default": true,
                     "markdownDescription": "Enable constraints that allow a TypeScript project to be used with project references.\n\nSee more: https://www.typescriptlang.org/tsconfig#composite"
                  },
                  "customConditions": {
                     "description": "Conditions to set in addition to the resolver-specific defaults when resolving imports.",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": "string"
                     },
                     "markdownDescription": "Conditions to set in addition to the resolver-specific defaults when resolving imports.\n\nSee more: https://www.typescriptlang.org/tsconfig#customConditions"
                  },
                  "declaration": {
                     "description": "Generate .d.ts files from TypeScript and JavaScript files in your project.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Generate .d.ts files from TypeScript and JavaScript files in your project.\n\nSee more: https://www.typescriptlang.org/tsconfig#declaration"
                  },
                  "declarationDir": {
                     "description": "Specify the output directory for generated declaration files.",
                     "type": ["string", "null"],
                     "markdownDescription": "Specify the output directory for generated declaration files.\n\nSee more: https://www.typescriptlang.org/tsconfig#declarationDir"
                  },
                  "diagnostics": {
                     "description": "Output compiler performance information after building.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Output compiler performance information after building.\n\nSee more: https://www.typescriptlang.org/tsconfig#diagnostics"
                  },
                  "disableReferencedProjectLoad": {
                     "description": "Reduce the number of projects loaded automatically by TypeScript.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Reduce the number of projects loaded automatically by TypeScript.\n\nSee more: https://www.typescriptlang.org/tsconfig#disableReferencedProjectLoad"
                  },
                  "noPropertyAccessFromIndexSignature": {
                     "description": "Enforces using indexed accessors for keys declared using an indexed type.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Enforces using indexed accessors for keys declared using an indexed type.\n\nSee more: https://www.typescriptlang.org/tsconfig#noPropertyAccessFromIndexSignature"
                  },
                  "emitBOM": {
                     "description": "Emit a UTF-8 Byte Order Mark (BOM) in the beginning of output files.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Emit a UTF-8 Byte Order Mark (BOM) in the beginning of output files.\n\nSee more: https://www.typescriptlang.org/tsconfig#emitBOM"
                  },
                  "emitDeclarationOnly": {
                     "description": "Only output d.ts files and not JavaScript files.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Only output d.ts files and not JavaScript files.\n\nSee more: https://www.typescriptlang.org/tsconfig#emitDeclarationOnly"
                  },
                  "erasableSyntaxOnly": {
                     "description": "Do not allow runtime constructs that are not part of ECMAScript.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Do not allow runtime constructs that are not part of ECMAScript.\n\nSee more: https://www.typescriptlang.org/tsconfig#erasableSyntaxOnly"
                  },
                  "exactOptionalPropertyTypes": {
                     "description": "Interpret optional property types as written, rather than adding `undefined`.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Interpret optional property types as written, rather than adding `undefined`.\n\nSee more: https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes"
                  },
                  "incremental": {
                     "description": "Enable incremental compilation. Requires TypeScript version 3.4 or later.",
                     "type": ["boolean", "null"]
                  },
                  "tsBuildInfoFile": {
                     "description": "Specify the path to .tsbuildinfo incremental compilation file.",
                     "default": ".tsbuildinfo",
                     "type": ["string", "null"],
                     "markdownDescription": "Specify the path to .tsbuildinfo incremental compilation file.\n\nSee more: https://www.typescriptlang.org/tsconfig#tsBuildInfoFile"
                  },
                  "inlineSourceMap": {
                     "description": "Include sourcemap files inside the emitted JavaScript.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Include sourcemap files inside the emitted JavaScript.\n\nSee more: https://www.typescriptlang.org/tsconfig#inlineSourceMap"
                  },
                  "inlineSources": {
                     "description": "Include source code in the sourcemaps inside the emitted JavaScript.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Include source code in the sourcemaps inside the emitted JavaScript.\n\nSee more: https://www.typescriptlang.org/tsconfig#inlineSources"
                  },
                  "jsx": {
                     "description": "Specify what JSX code is generated.",
                     "enum": ["preserve", "react", "react-jsx", "react-jsxdev", "react-native"],
                     "markdownDescription": "Specify what JSX code is generated.\n\nSee more: https://www.typescriptlang.org/tsconfig#jsx"
                  },
                  "reactNamespace": {
                     "description": "Specify the object invoked for `createElement`. This only applies when targeting `react` JSX emit.",
                     "type": ["string", "null"],
                     "default": "React",
                     "markdownDescription": "Specify the object invoked for `createElement`. This only applies when targeting `react` JSX emit.\n\nSee more: https://www.typescriptlang.org/tsconfig#reactNamespace"
                  },
                  "jsxFactory": {
                     "description": "Specify the JSX factory function used when targeting React JSX emit, e.g. `React.createElement` or `h`.",
                     "type": ["string", "null"],
                     "default": "React.createElement",
                     "markdownDescription": "Specify the JSX factory function used when targeting React JSX emit, e.g. `React.createElement` or `h`.\n\nSee more: https://www.typescriptlang.org/tsconfig#jsxFactory"
                  },
                  "jsxFragmentFactory": {
                     "description": "Specify the JSX Fragment reference used for fragments when targeting React JSX emit e.g. `React.Fragment` or `Fragment`.",
                     "type": ["string", "null"],
                     "default": "React.Fragment",
                     "markdownDescription": "Specify the JSX Fragment reference used for fragments when targeting React JSX emit e.g. `React.Fragment` or `Fragment`.\n\nSee more: https://www.typescriptlang.org/tsconfig#jsxFragmentFactory"
                  },
                  "jsxImportSource": {
                     "description": "Specify module specifier used to import the JSX factory functions when using `jsx: react-jsx`.",
                     "type": ["string", "null"],
                     "default": "react",
                     "markdownDescription": "Specify module specifier used to import the JSX factory functions when using `jsx: react-jsx`.\n\nSee more: https://www.typescriptlang.org/tsconfig#jsxImportSource"
                  },
                  "listFiles": {
                     "description": "Print all of the files read during the compilation.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Print all of the files read during the compilation.\n\nSee more: https://www.typescriptlang.org/tsconfig#listFiles"
                  },
                  "mapRoot": {
                     "description": "Specify the location where debugger should locate map files instead of generated locations.",
                     "type": ["string", "null"],
                     "markdownDescription": "Specify the location where debugger should locate map files instead of generated locations.\n\nSee more: https://www.typescriptlang.org/tsconfig#mapRoot"
                  },
                  "module": {
                     "description": "Specify what module code is generated.",
                     "type": ["string", "null"],
                     "anyOf": [
                        {
                           "enum": [
                              "commonjs",
                              "amd",
                              "system",
                              "umd",
                              "es6",
                              "es2015",
                              "es2020",
                              "esnext",
                              "none",
                              "es2022",
                              "node16",
                              "node18",
                              "node20",
                              "nodenext",
                              "preserve"
                           ]
                        },
                        {
                           "pattern": "^([Cc][Oo][Mm][Mm][Oo][Nn][Jj][Ss]|[AaUu][Mm][Dd]|[Ss][Yy][Ss][Tt][Ee][Mm]|[Ee][Ss]([356]|20(1[567]|2[02])|[Nn][Ee][Xx][Tt])|[Nn][Oo][dD][Ee]1[68]|[Nn][Oo][Dd][Ee][Nn][Ee][Xx][Tt]|[Nn][Oo][Nn][Ee]|[Pp][Rr][Ee][Ss][Ee][Rr][Vv][Ee])$"
                        }
                     ],
                     "markdownDescription": "Specify what module code is generated.\n\nSee more: https://www.typescriptlang.org/tsconfig#module"
                  },
                  "moduleResolution": {
                     "description": "Specify how TypeScript looks up a file from a given module specifier.",
                     "type": ["string", "null"],
                     "anyOf": [
                        {
                           "enum": ["classic", "node", "node10", "node16", "nodenext", "bundler"],
                           "markdownEnumDescriptions": [
                              "It’s recommended to use `\"node16\"` instead",
                              "Deprecated, use `\"node10\"` in TypeScript 5.0+ instead",
                              "It’s recommended to use `\"node16\"` instead",
                              "This is the recommended setting for libraries and Node.js applications",
                              "This is the recommended setting for libraries and Node.js applications",
                              "This is the recommended setting in TypeScript 5.0+ for applications that use a bundler"
                           ]
                        },
                        {
                           "pattern": "^(([Nn]ode)|([Nn]ode1[06])|([Nn]ode[Nn]ext)|([Cc]lassic)|([Bb]undler))$"
                        }
                     ],
                     "markdownDescription": "Specify how TypeScript looks up a file from a given module specifier.\n\nSee more: https://www.typescriptlang.org/tsconfig#moduleResolution"
                  },
                  "moduleSuffixes": {
                     "description": "List of file name suffixes to search when resolving a module.",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": "string"
                     },
                     "markdownDescription": "List of file name suffixes to search when resolving a module.\n\nSee more: https://www.typescriptlang.org/tsconfig#moduleSuffixes"
                  },
                  "newLine": {
                     "description": "Set the newline character for emitting files.",
                     "type": ["string", "null"],
                     "default": "lf",
                     "anyOf": [
                        {
                           "enum": ["crlf", "lf"]
                        },
                        {
                           "pattern": "^(CRLF|LF|crlf|lf)$"
                        }
                     ],
                     "markdownDescription": "Set the newline character for emitting files.\n\nSee more: https://www.typescriptlang.org/tsconfig#newLine"
                  },
                  "noEmit": {
                     "description": "Disable emitting files from a compilation.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable emitting files from a compilation.\n\nSee more: https://www.typescriptlang.org/tsconfig#noEmit"
                  },
                  "noEmitHelpers": {
                     "description": "Disable generating custom helper functions like `__extends` in compiled output.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable generating custom helper functions like `__extends` in compiled output.\n\nSee more: https://www.typescriptlang.org/tsconfig#noEmitHelpers"
                  },
                  "noEmitOnError": {
                     "description": "Disable emitting files if any type checking errors are reported.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable emitting files if any type checking errors are reported.\n\nSee more: https://www.typescriptlang.org/tsconfig#noEmitOnError"
                  },
                  "noImplicitAny": {
                     "description": "Enable error reporting for expressions and declarations with an implied `any` type.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Enable error reporting for expressions and declarations with an implied `any` type.\n\nSee more: https://www.typescriptlang.org/tsconfig#noImplicitAny"
                  },
                  "noImplicitThis": {
                     "description": "Enable error reporting when `this` is given the type `any`.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Enable error reporting when `this` is given the type `any`.\n\nSee more: https://www.typescriptlang.org/tsconfig#noImplicitThis"
                  },
                  "noUnusedLocals": {
                     "description": "Enable error reporting when local variables aren't read.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Enable error reporting when local variables aren't read.\n\nSee more: https://www.typescriptlang.org/tsconfig#noUnusedLocals"
                  },
                  "noUnusedParameters": {
                     "description": "Raise an error when a function parameter isn't read.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Raise an error when a function parameter isn't read.\n\nSee more: https://www.typescriptlang.org/tsconfig#noUnusedParameters"
                  },
                  "noLib": {
                     "description": "Disable including any library files, including the default lib.d.ts.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable including any library files, including the default lib.d.ts.\n\nSee more: https://www.typescriptlang.org/tsconfig#noLib"
                  },
                  "noResolve": {
                     "description": "Disallow `import`s, `require`s or `<reference>`s from expanding the number of files TypeScript should add to a project.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disallow `import`s, `require`s or `<reference>`s from expanding the number of files TypeScript should add to a project.\n\nSee more: https://www.typescriptlang.org/tsconfig#noResolve"
                  },
                  "noStrictGenericChecks": {
                     "description": "Disable strict checking of generic signatures in function types.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable strict checking of generic signatures in function types.\n\nSee more: https://www.typescriptlang.org/tsconfig#noStrictGenericChecks"
                  },
                  "out": {
                     "description": "Deprecated setting. Use `outFile` instead.",
                     "type": ["string", "null"],
                     "markdownDescription": "Deprecated setting. Use `outFile` instead.\n\nSee more: https://www.typescriptlang.org/tsconfig#out"
                  },
                  "skipDefaultLibCheck": {
                     "description": "Skip type checking .d.ts files that are included with TypeScript.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Skip type checking .d.ts files that are included with TypeScript.\n\nSee more: https://www.typescriptlang.org/tsconfig#skipDefaultLibCheck"
                  },
                  "skipLibCheck": {
                     "description": "Skip type checking all .d.ts files.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Skip type checking all .d.ts files.\n\nSee more: https://www.typescriptlang.org/tsconfig#skipLibCheck"
                  },
                  "outFile": {
                     "description": "Specify a file that bundles all outputs into one JavaScript file. If `declaration` is true, also designates a file that bundles all .d.ts output.",
                     "type": ["string", "null"],
                     "markdownDescription": "Specify a file that bundles all outputs into one JavaScript file. If `declaration` is true, also designates a file that bundles all .d.ts output.\n\nSee more: https://www.typescriptlang.org/tsconfig#outFile"
                  },
                  "outDir": {
                     "description": "Specify an output folder for all emitted files.",
                     "type": ["string", "null"],
                     "markdownDescription": "Specify an output folder for all emitted files.\n\nSee more: https://www.typescriptlang.org/tsconfig#outDir"
                  },
                  "preserveConstEnums": {
                     "description": "Disable erasing `const enum` declarations in generated code.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable erasing `const enum` declarations in generated code.\n\nSee more: https://www.typescriptlang.org/tsconfig#preserveConstEnums"
                  },
                  "preserveSymlinks": {
                     "description": "Disable resolving symlinks to their realpath. This correlates to the same flag in node.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable resolving symlinks to their realpath. This correlates to the same flag in node.\n\nSee more: https://www.typescriptlang.org/tsconfig#preserveSymlinks"
                  },
                  "preserveValueImports": {
                     "description": "Preserve unused imported values in the JavaScript output that would otherwise be removed.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Preserve unused imported values in the JavaScript output that would otherwise be removed.\n\nSee more: https://www.typescriptlang.org/tsconfig#preserveValueImports"
                  },
                  "preserveWatchOutput": {
                     "description": "Disable wiping the console in watch mode.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Disable wiping the console in watch mode.\n\nSee more: https://www.typescriptlang.org/tsconfig#preserveWatchOutput"
                  },
                  "pretty": {
                     "description": "Enable color and formatting in TypeScript's output to make compiler errors easier to read.",
                     "type": ["boolean", "null"],
                     "default": true,
                     "markdownDescription": "Enable color and formatting in TypeScript's output to make compiler errors easier to read.\n\nSee more: https://www.typescriptlang.org/tsconfig#pretty"
                  },
                  "removeComments": {
                     "description": "Disable emitting comments.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable emitting comments.\n\nSee more: https://www.typescriptlang.org/tsconfig#removeComments"
                  },
                  "rewriteRelativeImportExtensions": {
                     "description": "Rewrite `.ts`, `.tsx`, `.mts`, and `.cts` file extensions in relative import paths to their JavaScript equivalent in output files.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Rewrite `.ts`, `.tsx`, `.mts`, and `.cts` file extensions in relative import paths to their JavaScript equivalent in output files.\n\nSee more: https://www.typescriptlang.org/tsconfig#rewriteRelativeImportExtensions"
                  },
                  "rootDir": {
                     "description": "Specify the root folder within your source files.",
                     "type": ["string", "null"],
                     "markdownDescription": "Specify the root folder within your source files.\n\nSee more: https://www.typescriptlang.org/tsconfig#rootDir"
                  },
                  "isolatedModules": {
                     "description": "Ensure that each file can be safely transpiled without relying on other imports.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Ensure that each file can be safely transpiled without relying on other imports.\n\nSee more: https://www.typescriptlang.org/tsconfig#isolatedModules"
                  },
                  "sourceMap": {
                     "description": "Create source map files for emitted JavaScript files.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Create source map files for emitted JavaScript files.\n\nSee more: https://www.typescriptlang.org/tsconfig#sourceMap"
                  },
                  "sourceRoot": {
                     "description": "Specify the root path for debuggers to find the reference source code.",
                     "type": ["string", "null"],
                     "markdownDescription": "Specify the root path for debuggers to find the reference source code.\n\nSee more: https://www.typescriptlang.org/tsconfig#sourceRoot"
                  },
                  "suppressExcessPropertyErrors": {
                     "description": "Disable reporting of excess property errors during the creation of object literals.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable reporting of excess property errors during the creation of object literals.\n\nSee more: https://www.typescriptlang.org/tsconfig#suppressExcessPropertyErrors"
                  },
                  "suppressImplicitAnyIndexErrors": {
                     "description": "Suppress `noImplicitAny` errors when indexing objects that lack index signatures.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Suppress `noImplicitAny` errors when indexing objects that lack index signatures.\n\nSee more: https://www.typescriptlang.org/tsconfig#suppressImplicitAnyIndexErrors"
                  },
                  "stripInternal": {
                     "description": "Disable emitting declarations that have `@internal` in their JSDoc comments.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Disable emitting declarations that have `@internal` in their JSDoc comments.\n\nSee more: https://www.typescriptlang.org/tsconfig#stripInternal"
                  },
                  "target": {
                     "description": "Set the JavaScript language version for emitted JavaScript and include compatible library declarations.",
                     "type": ["string", "null"],
                     "default": "es3",
                     "anyOf": [
                        {
                           "enum": [
                              "es3",
                              "es5",
                              "es6",
                              "es2015",
                              "es2016",
                              "es2017",
                              "es2018",
                              "es2019",
                              "es2020",
                              "es2021",
                              "es2022",
                              "es2023",
                              "es2024",
                              "esnext"
                           ]
                        },
                        {
                           "pattern": "^([Ee][Ss]([356]|(20(1[56789]|2[01234]))|[Nn][Ee][Xx][Tt]))$"
                        }
                     ],
                     "markdownDescription": "Set the JavaScript language version for emitted JavaScript and include compatible library declarations.\n\nSee more: https://www.typescriptlang.org/tsconfig#target"
                  },
                  "useUnknownInCatchVariables": {
                     "description": "Default catch clause variables as `unknown` instead of `any`.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Default catch clause variables as `unknown` instead of `any`.\n\nSee more: https://www.typescriptlang.org/tsconfig#useUnknownInCatchVariables"
                  },
                  "watch": {
                     "description": "Watch input files.",
                     "type": ["boolean", "null"]
                  },
                  "fallbackPolling": {
                     "description": "Specify the polling strategy to use when the system runs out of or doesn't support native file watchers. Requires TypeScript version 3.8 or later.",
                     "enum": [
                        "fixedPollingInterval",
                        "priorityPollingInterval",
                        "dynamicPriorityPolling",
                        "fixedInterval",
                        "priorityInterval",
                        "dynamicPriority",
                        "fixedChunkSize"
                     ]
                  },
                  "watchDirectory": {
                     "description": "Specify the strategy for watching directories under systems that lack recursive file-watching functionality. Requires TypeScript version 3.8 or later.",
                     "enum": [
                        "useFsEvents",
                        "fixedPollingInterval",
                        "dynamicPriorityPolling",
                        "fixedChunkSizePolling"
                     ],
                     "default": "useFsEvents"
                  },
                  "watchFile": {
                     "description": "Specify the strategy for watching individual files. Requires TypeScript version 3.8 or later.",
                     "enum": [
                        "fixedPollingInterval",
                        "priorityPollingInterval",
                        "dynamicPriorityPolling",
                        "useFsEvents",
                        "useFsEventsOnParentDirectory",
                        "fixedChunkSizePolling"
                     ],
                     "default": "useFsEvents"
                  },
                  "experimentalDecorators": {
                     "description": "Enable experimental support for legacy experimental decorators.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Enable experimental support for legacy experimental decorators.\n\nSee more: https://www.typescriptlang.org/tsconfig#experimentalDecorators"
                  },
                  "emitDecoratorMetadata": {
                     "description": "Emit design-type metadata for decorated declarations in source files.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Emit design-type metadata for decorated declarations in source files.\n\nSee more: https://www.typescriptlang.org/tsconfig#emitDecoratorMetadata"
                  },
                  "allowUnusedLabels": {
                     "description": "Disable error reporting for unused labels.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Disable error reporting for unused labels.\n\nSee more: https://www.typescriptlang.org/tsconfig#allowUnusedLabels"
                  },
                  "noImplicitReturns": {
                     "description": "Enable error reporting for codepaths that do not explicitly return in a function.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Enable error reporting for codepaths that do not explicitly return in a function.\n\nSee more: https://www.typescriptlang.org/tsconfig#noImplicitReturns"
                  },
                  "noUncheckedIndexedAccess": {
                     "description": "Add `undefined` to a type when accessed using an index.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Add `undefined` to a type when accessed using an index.\n\nSee more: https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess"
                  },
                  "noFallthroughCasesInSwitch": {
                     "description": "Enable error reporting for fallthrough cases in switch statements.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Enable error reporting for fallthrough cases in switch statements.\n\nSee more: https://www.typescriptlang.org/tsconfig#noFallthroughCasesInSwitch"
                  },
                  "noImplicitOverride": {
                     "description": "Ensure overriding members in derived classes are marked with an override modifier.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Ensure overriding members in derived classes are marked with an override modifier.\n\nSee more: https://www.typescriptlang.org/tsconfig#noImplicitOverride"
                  },
                  "allowUnreachableCode": {
                     "description": "Disable error reporting for unreachable code.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Disable error reporting for unreachable code.\n\nSee more: https://www.typescriptlang.org/tsconfig#allowUnreachableCode"
                  },
                  "forceConsistentCasingInFileNames": {
                     "description": "Ensure that casing is correct in imports.",
                     "type": ["boolean", "null"],
                     "default": true,
                     "markdownDescription": "Ensure that casing is correct in imports.\n\nSee more: https://www.typescriptlang.org/tsconfig#forceConsistentCasingInFileNames"
                  },
                  "generateCpuProfile": {
                     "description": "Emit a v8 CPU profile of the compiler run for debugging.",
                     "type": ["string", "null"],
                     "default": "profile.cpuprofile",
                     "markdownDescription": "Emit a v8 CPU profile of the compiler run for debugging.\n\nSee more: https://www.typescriptlang.org/tsconfig#generateCpuProfile"
                  },
                  "baseUrl": {
                     "description": "Specify the base directory to resolve non-relative module names.",
                     "type": ["string", "null"],
                     "markdownDescription": "Specify the base directory to resolve non-relative module names.\n\nSee more: https://www.typescriptlang.org/tsconfig#baseUrl"
                  },
                  "paths": {
                     "description": "Specify a set of entries that re-map imports to additional lookup locations.",
                     "type": ["object", "null"],
                     "additionalProperties": {
                        "type": ["array", "null"],
                        "uniqueItems": true,
                        "items": {
                           "type": "string",
                           "description": "Path mapping to be computed relative to baseUrl option."
                        }
                     },
                     "markdownDescription": "Specify a set of entries that re-map imports to additional lookup locations.\n\nSee more: https://www.typescriptlang.org/tsconfig#paths"
                  },
                  "plugins": {
                     "description": "Specify a list of language service plugins to include.",
                     "type": ["array", "null"],
                     "items": {
                        "type": "object",
                        "properties": {
                           "name": {
                              "description": "Plugin name.",
                              "type": "string"
                           }
                        }
                     },
                     "markdownDescription": "Specify a list of language service plugins to include.\n\nSee more: https://www.typescriptlang.org/tsconfig#plugins"
                  },
                  "rootDirs": {
                     "description": "Allow multiple folders to be treated as one when resolving modules.",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": "string"
                     },
                     "markdownDescription": "Allow multiple folders to be treated as one when resolving modules.\n\nSee more: https://www.typescriptlang.org/tsconfig#rootDirs"
                  },
                  "typeRoots": {
                     "description": "Specify multiple folders that act like `./node_modules/@types`.",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": "string"
                     },
                     "markdownDescription": "Specify multiple folders that act like `./node_modules/@types`.\n\nSee more: https://www.typescriptlang.org/tsconfig#typeRoots"
                  },
                  "types": {
                     "description": "Specify type package names to be included without being referenced in a source file.",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": "string"
                     },
                     "markdownDescription": "Specify type package names to be included without being referenced in a source file.\n\nSee more: https://www.typescriptlang.org/tsconfig#types"
                  },
                  "traceResolution": {
                     "description": "Log paths used during the `moduleResolution` process.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Log paths used during the `moduleResolution` process.\n\nSee more: https://www.typescriptlang.org/tsconfig#traceResolution"
                  },
                  "allowJs": {
                     "description": "Allow JavaScript files to be a part of your program. Use the `checkJs` option to get errors from these files.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Allow JavaScript files to be a part of your program. Use the `checkJs` option to get errors from these files.\n\nSee more: https://www.typescriptlang.org/tsconfig#allowJs"
                  },
                  "noErrorTruncation": {
                     "description": "Disable truncating types in error messages.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable truncating types in error messages.\n\nSee more: https://www.typescriptlang.org/tsconfig#noErrorTruncation"
                  },
                  "allowSyntheticDefaultImports": {
                     "description": "Allow `import x from y` when a module doesn't have a default export.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Allow `import x from y` when a module doesn't have a default export.\n\nSee more: https://www.typescriptlang.org/tsconfig#allowSyntheticDefaultImports"
                  },
                  "noImplicitUseStrict": {
                     "description": "Disable adding `use strict` directives in emitted JavaScript files.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable adding `use strict` directives in emitted JavaScript files.\n\nSee more: https://www.typescriptlang.org/tsconfig#noImplicitUseStrict"
                  },
                  "listEmittedFiles": {
                     "description": "Print the names of emitted files after a compilation.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Print the names of emitted files after a compilation.\n\nSee more: https://www.typescriptlang.org/tsconfig#listEmittedFiles"
                  },
                  "disableSizeLimit": {
                     "description": "Remove the 20mb cap on total source code size for JavaScript files in the TypeScript language server.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Remove the 20mb cap on total source code size for JavaScript files in the TypeScript language server.\n\nSee more: https://www.typescriptlang.org/tsconfig#disableSizeLimit"
                  },
                  "lib": {
                     "description": "Specify a set of bundled library declaration files that describe the target runtime environment.",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": "string",
                        "anyOf": [
                           {
                              "enum": [
                                 "ES5",
                                 "ES6",
                                 "ES2015",
                                 "ES2015.Collection",
                                 "ES2015.Core",
                                 "ES2015.Generator",
                                 "ES2015.Iterable",
                                 "ES2015.Promise",
                                 "ES2015.Proxy",
                                 "ES2015.Reflect",
                                 "ES2015.Symbol.WellKnown",
                                 "ES2015.Symbol",
                                 "ES2016",
                                 "ES2016.Array.Include",
                                 "ES2017",
                                 "ES2017.Intl",
                                 "ES2017.Object",
                                 "ES2017.SharedMemory",
                                 "ES2017.String",
                                 "ES2017.TypedArrays",
                                 "ES2017.ArrayBuffer",
                                 "ES2018",
                                 "ES2018.AsyncGenerator",
                                 "ES2018.AsyncIterable",
                                 "ES2018.Intl",
                                 "ES2018.Promise",
                                 "ES2018.Regexp",
                                 "ES2019",
                                 "ES2019.Array",
                                 "ES2019.Intl",
                                 "ES2019.Object",
                                 "ES2019.String",
                                 "ES2019.Symbol",
                                 "ES2020",
                                 "ES2020.BigInt",
                                 "ES2020.Promise",
                                 "ES2020.String",
                                 "ES2020.Symbol.WellKnown",
                                 "ESNext",
                                 "ESNext.Array",
                                 "ESNext.AsyncIterable",
                                 "ESNext.BigInt",
                                 "ESNext.Collection",
                                 "ESNext.Intl",
                                 "ESNext.Iterator",
                                 "ESNext.Object",
                                 "ESNext.Promise",
                                 "ESNext.Regexp",
                                 "ESNext.String",
                                 "ESNext.Symbol",
                                 "DOM",
                                 "DOM.AsyncIterable",
                                 "DOM.Iterable",
                                 "ScriptHost",
                                 "WebWorker",
                                 "WebWorker.AsyncIterable",
                                 "WebWorker.ImportScripts",
                                 "Webworker.Iterable",
                                 "ES7",
                                 "ES2021",
                                 "ES2020.SharedMemory",
                                 "ES2020.Intl",
                                 "ES2020.Date",
                                 "ES2020.Number",
                                 "ES2021.Promise",
                                 "ES2021.String",
                                 "ES2021.WeakRef",
                                 "ESNext.WeakRef",
                                 "ES2021.Intl",
                                 "ES2022",
                                 "ES2022.Array",
                                 "ES2022.Error",
                                 "ES2022.Intl",
                                 "ES2022.Object",
                                 "ES2022.String",
                                 "ES2022.SharedMemory",
                                 "ES2022.RegExp",
                                 "ES2023",
                                 "ES2023.Array",
                                 "ES2024",
                                 "ES2024.ArrayBuffer",
                                 "ES2024.Collection",
                                 "ES2024.Object",
                                 "ES2024.Promise",
                                 "ES2024.Regexp",
                                 "ES2024.SharedMemory",
                                 "ES2024.String",
                                 "Decorators",
                                 "Decorators.Legacy",
                                 "ES2017.Date",
                                 "ES2023.Collection",
                                 "ESNext.Decorators",
                                 "ESNext.Disposable",
                                 "ESNext.Error",
                                 "ESNext.Sharedmemory"
                              ]
                           },
                           {
                              "pattern": "^[Ee][Ss]5|[Ee][Ss]6|[Ee][Ss]7$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2015(\\.([Cc][Oo][Ll][Ll][Ee][Cc][Tt][Ii][Oo][Nn]|[Cc][Oo][Rr][Ee]|[Gg][Ee][Nn][Ee][Rr][Aa][Tt][Oo][Rr]|[Ii][Tt][Ee][Rr][Aa][Bb][Ll][Ee]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Pp][Rr][Oo][Xx][Yy]|[Rr][Ee][Ff][Ll][Ee][Cc][Tt]|[Ss][Yy][Mm][Bb][Oo][Ll]\\.[Ww][Ee][Ll][Ll][Kk][Nn][Oo][Ww][Nn]|[Ss][Yy][Mm][Bb][Oo][Ll]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2016(\\.[Aa][Rr][Rr][Aa][Yy]\\.[Ii][Nn][Cc][Ll][Uu][Dd][Ee])?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2017(\\.([Ii][Nn][Tt][Ll]|[Oo][Bb][Jj][Ee][Cc][Tt]|[Ss][Hh][Aa][Rr][Ee][Dd][Mm][Ee][Mm][Oo][Rr][Yy]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Tt][Yy][Pp][Ee][Dd][Aa][Rr][Rr][Aa][Yy][Ss]|[Dd][Aa][Tt][Ee]|[Aa][Rr][Rr][Aa][Yy][Bb][Uu][Ff][Ff][Ee][Rr]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2018(\\.([Aa][Ss][Yy][Nn][Cc][Gg][Ee][Nn][Ee][Rr][Aa][Tt][Oo][Rr]|[Aa][Ss][Yy][Nn][Cc][Ii][Tt][Ee][Rr][Aa][Bb][Ll][Ee]|[Ii][Nn][Tt][Ll]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Rr][Ee][Gg][Ee][Xx][Pp]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2019(\\.([Aa][Rr][Rr][Aa][Yy]|[Ii][Nn][Tt][Ll]|[Oo][Bb][Jj][Ee][Cc][Tt]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Ss][Yy][Mm][Bb][Oo][Ll]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2020(\\.([Bb][Ii][Gg][Ii][Nn][Tt]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Ss][Yy][Mm][Bb][Oo][Ll]\\.[Ww][Ee][Ll][Ll][Kk][Nn][Oo][Ww][Nn]|[Ss][Hh][Aa][Rr][Ee][Dd][Mm][Ee][Mm][Oo][Rr][Yy]|[Ii][Nn][Tt][Ll]|[Dd][Aa][Tt][Ee]|[Nn][Uu][Mm][Bb][Ee][Rr]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2021(\\.([Ii][Nn][Tt][Ll]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Ww][Ee][Aa][Kk][Rr][Ee][Ff]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2022(\\.([Aa][Rr][Rr][Aa][Yy]|[Ee][Rr][Rr][Oo][Rr]|[Ii][Nn][Tt][Ll]|[Oo][Bb][Jj][Ee][Cc][Tt]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Ss][Hh][Aa][Rr][Ee][Dd][Mm][Ee][Mm][Oo][Rr][Yy]|[Rr][Ee][Gg][Ee][Xx][Pp]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2023(\\.([Aa][Rr][Rr][Aa][Yy]|[Cc][Oo][Ll][Ll][Ee][Cc][Tt][Ii][Oo][Nn]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss]2024(\\.([Aa][Rr][Rr][Aa][Yy][Bb][Uu][Ff][Ff][Ee][Rr]|[Cc][Oo][Ll][Ll][Ee][Cc][Tt][Ii][Oo][Nn]|[Oo][Bb][Jj][Ee][Cc][Tt]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Rr][Ee][Gg][Ee][Xx][Pp]|[Ss][Hh][Aa][Rr][Ee][Dd][Mm][Ee][Mm][Oo][Rr][Yy]|[Ss][Tt][Rr][Ii][Nn][Gg]))?$"
                           },
                           {
                              "pattern": "^[Ee][Ss][Nn][Ee][Xx][Tt](\\.([Aa][Rr][Rr][Aa][Yy]|[Aa][Ss][Yy][Nn][Cc][Ii][Tt][Ee][Rr][Aa][Bb][Ll][Ee]|[Bb][Ii][Gg][Ii][Nn][Tt]|[Ii][Nn][Tt][Ll]|[Pp][Rr][Oo][Mm][Ii][Ss][Ee]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Ss][Yy][Mm][Bb][Oo][Ll]|[Ww][Ee][Aa][Kk][Rr][Ee][Ff]|[Dd][Ee][Cc][Oo][Rr][Aa][Tt][Oo][Rr][Ss]|[Dd][Ii][Ss][Pp][Oo][Ss][Aa][Bb][Ll][Ee]))?$"
                           },
                           {
                              "pattern": "^[Dd][Oo][Mm](\\.([Aa][Ss][Yy][Nn][Cc])?[Ii][Tt][Ee][Rr][Aa][Bb][Ll][Ee])?$"
                           },
                           {
                              "pattern": "^[Ss][Cc][Rr][Ii][Pp][Tt][Hh][Oo][Ss][Tt]$"
                           },
                           {
                              "pattern": "^[Ww][Ee][Bb][Ww][Oo][Rr][Kk][Ee][Rr](\\.([Ii][Mm][Pp][Oo][Rr][Tt][Ss][Cc][Rr][Ii][Pp][Tt][Ss]|([Aa][Ss][Yy][Nn][Cc])?[Ii][Tt][Ee][Rr][Aa][Bb][Ll][Ee]))?$"
                           },
                           {
                              "pattern": "^[Dd][Ee][Cc][Oo][Rr][Aa][Tt][Oo][Rr][Ss](\\.([Ll][Ee][Gg][Aa][Cc][Yy]))?$"
                           }
                        ]
                     },
                     "markdownDescription": "Specify a set of bundled library declaration files that describe the target runtime environment.\n\nSee more: https://www.typescriptlang.org/tsconfig#lib"
                  },
                  "libReplacement": {
                     "description": "Enable lib replacement.",
                     "type": ["boolean", "null"],
                     "default": true,
                     "markdownDescription": "Enable lib replacement.\n\nSee more: https://www.typescriptlang.org/tsconfig#libReplacement"
                  },
                  "moduleDetection": {
                     "description": "Control what method is used to detect module-format JS files.",
                     "enum": ["auto", "legacy", "force"],
                     "markdownDescription": "Control what method is used to detect module-format JS files.\n\nSee more: https://www.typescriptlang.org/tsconfig#moduleDetection"
                  },
                  "strictNullChecks": {
                     "description": "When type checking, take into account `null` and `undefined`.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "When type checking, take into account `null` and `undefined`.\n\nSee more: https://www.typescriptlang.org/tsconfig#strictNullChecks"
                  },
                  "maxNodeModuleJsDepth": {
                     "description": "Specify the maximum folder depth used for checking JavaScript files from `node_modules`. Only applicable with `allowJs`.",
                     "type": ["number", "null"],
                     "default": 0,
                     "markdownDescription": "Specify the maximum folder depth used for checking JavaScript files from `node_modules`. Only applicable with `allowJs`.\n\nSee more: https://www.typescriptlang.org/tsconfig#maxNodeModuleJsDepth"
                  },
                  "importHelpers": {
                     "description": "Allow importing helper functions from tslib once per project, instead of including them per-file.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Allow importing helper functions from tslib once per project, instead of including them per-file.\n\nSee more: https://www.typescriptlang.org/tsconfig#importHelpers"
                  },
                  "importsNotUsedAsValues": {
                     "description": "Specify emit/checking behavior for imports that are only used for types.",
                     "default": "remove",
                     "enum": ["remove", "preserve", "error"],
                     "markdownDescription": "Specify emit/checking behavior for imports that are only used for types.\n\nSee more: https://www.typescriptlang.org/tsconfig#importsNotUsedAsValues"
                  },
                  "alwaysStrict": {
                     "description": "Ensure `use strict` is always emitted.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Ensure `use strict` is always emitted.\n\nSee more: https://www.typescriptlang.org/tsconfig#alwaysStrict"
                  },
                  "strict": {
                     "description": "Enable all strict type-checking options.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Enable all strict type-checking options.\n\nSee more: https://www.typescriptlang.org/tsconfig#strict"
                  },
                  "strictBindCallApply": {
                     "description": "Check that the arguments for `bind`, `call`, and `apply` methods match the original function.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Check that the arguments for `bind`, `call`, and `apply` methods match the original function.\n\nSee more: https://www.typescriptlang.org/tsconfig#strictBindCallApply"
                  },
                  "downlevelIteration": {
                     "description": "Emit more compliant, but verbose and less performant JavaScript for iteration.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Emit more compliant, but verbose and less performant JavaScript for iteration.\n\nSee more: https://www.typescriptlang.org/tsconfig#downlevelIteration"
                  },
                  "checkJs": {
                     "description": "Enable error reporting in type-checked JavaScript files.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Enable error reporting in type-checked JavaScript files.\n\nSee more: https://www.typescriptlang.org/tsconfig#checkJs"
                  },
                  "strictFunctionTypes": {
                     "description": "When assigning functions, check to ensure parameters and the return values are subtype-compatible.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "When assigning functions, check to ensure parameters and the return values are subtype-compatible.\n\nSee more: https://www.typescriptlang.org/tsconfig#strictFunctionTypes"
                  },
                  "strictPropertyInitialization": {
                     "description": "Check for class properties that are declared but not set in the constructor.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Check for class properties that are declared but not set in the constructor.\n\nSee more: https://www.typescriptlang.org/tsconfig#strictPropertyInitialization"
                  },
                  "esModuleInterop": {
                     "description": "Emit additional JavaScript to ease support for importing CommonJS modules. This enables `allowSyntheticDefaultImports` for type compatibility.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Emit additional JavaScript to ease support for importing CommonJS modules. This enables `allowSyntheticDefaultImports` for type compatibility.\n\nSee more: https://www.typescriptlang.org/tsconfig#esModuleInterop"
                  },
                  "allowUmdGlobalAccess": {
                     "description": "Allow accessing UMD globals from modules.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Allow accessing UMD globals from modules.\n\nSee more: https://www.typescriptlang.org/tsconfig#allowUmdGlobalAccess"
                  },
                  "keyofStringsOnly": {
                     "description": "Make keyof only return strings instead of string, numbers or symbols. Legacy option.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Make keyof only return strings instead of string, numbers or symbols. Legacy option.\n\nSee more: https://www.typescriptlang.org/tsconfig#keyofStringsOnly"
                  },
                  "useDefineForClassFields": {
                     "description": "Emit ECMAScript-standard-compliant class fields.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Emit ECMAScript-standard-compliant class fields.\n\nSee more: https://www.typescriptlang.org/tsconfig#useDefineForClassFields"
                  },
                  "declarationMap": {
                     "description": "Create sourcemaps for d.ts files.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Create sourcemaps for d.ts files.\n\nSee more: https://www.typescriptlang.org/tsconfig#declarationMap"
                  },
                  "resolveJsonModule": {
                     "description": "Enable importing .json files.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Enable importing .json files.\n\nSee more: https://www.typescriptlang.org/tsconfig#resolveJsonModule"
                  },
                  "resolvePackageJsonExports": {
                     "description": "Use the package.json 'exports' field when resolving package imports.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Use the package.json 'exports' field when resolving package imports.\n\nSee more: https://www.typescriptlang.org/tsconfig#resolvePackageJsonExports"
                  },
                  "resolvePackageJsonImports": {
                     "description": "Use the package.json 'imports' field when resolving imports.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Use the package.json 'imports' field when resolving imports.\n\nSee more: https://www.typescriptlang.org/tsconfig#resolvePackageJsonImports"
                  },
                  "assumeChangesOnlyAffectDirectDependencies": {
                     "description": "Have recompiles in projects that use `incremental` and `watch` mode assume that changes within a file will only affect files directly depending on it.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Have recompiles in projects that use `incremental` and `watch` mode assume that changes within a file will only affect files directly depending on it.\n\nSee more: https://www.typescriptlang.org/tsconfig#assumeChangesOnlyAffectDirectDependencies"
                  },
                  "extendedDiagnostics": {
                     "description": "Output more detailed compiler performance information after building.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Output more detailed compiler performance information after building.\n\nSee more: https://www.typescriptlang.org/tsconfig#extendedDiagnostics"
                  },
                  "listFilesOnly": {
                     "description": "Print names of files that are part of the compilation and then stop processing.",
                     "type": ["boolean", "null"]
                  },
                  "disableSourceOfProjectReferenceRedirect": {
                     "description": "Disable preferring source files instead of declaration files when referencing composite projects.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Disable preferring source files instead of declaration files when referencing composite projects.\n\nSee more: https://www.typescriptlang.org/tsconfig#disableSourceOfProjectReferenceRedirect"
                  },
                  "disableSolutionSearching": {
                     "description": "Opt a project out of multi-project reference checking when editing.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Opt a project out of multi-project reference checking when editing.\n\nSee more: https://www.typescriptlang.org/tsconfig#disableSolutionSearching"
                  },
                  "verbatimModuleSyntax": {
                     "description": "Do not transform or elide any imports or exports not marked as type-only, ensuring they are written in the output file's format based on the `module` setting.",
                     "type": ["boolean", "null"],
                     "markdownDescription": "Do not transform or elide any imports or exports not marked as type-only, ensuring they are written in the output file's format based on the `module` setting.\n\nSee more: https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax"
                  },
                  "noCheck": {
                     "description": "Disable full type checking (only critical parse and emit errors will be reported).",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Disable full type checking (only critical parse and emit errors will be reported).\n\nSee more: https://www.typescriptlang.org/tsconfig#noCheck"
                  },
                  "isolatedDeclarations": {
                     "description": "Require sufficient annotation on exports so other tools can trivially generate declaration files.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Require sufficient annotation on exports so other tools can trivially generate declaration files.\n\nSee more: https://www.typescriptlang.org/tsconfig#isolatedDeclarations"
                  },
                  "noUncheckedSideEffectImports": {
                     "description": "Check side effect imports.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Check side effect imports.\n\nSee more: https://www.typescriptlang.org/tsconfig#noUncheckedSideEffectImports"
                  },
                  "strictBuiltinIteratorReturn": {
                     "description": "Built-in iterators are instantiated with a `TReturn` type of `undefined` instead of `any`.",
                     "type": ["boolean", "null"],
                     "default": false,
                     "markdownDescription": "Built-in iterators are instantiated with a `TReturn` type of `undefined` instead of `any`.\n\nSee more: https://www.typescriptlang.org/tsconfig#strictBuiltinIteratorReturn"
                  }
               }
            }
         }
      },
      "typeAcquisitionDefinition": {
         "properties": {
            "typeAcquisition": {
               "type": ["object", "null"],
               "description": "Auto type (.d.ts) acquisition options for this project. Requires TypeScript version 2.1 or later.",
               "properties": {
                  "enable": {
                     "description": "Enable auto type acquisition",
                     "type": ["boolean", "null"],
                     "default": false
                  },
                  "include": {
                     "description": "Specifies a list of type declarations to be included in auto type acquisition. Ex. [\"jquery\", \"lodash\"]",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": "string"
                     }
                  },
                  "exclude": {
                     "description": "Specifies a list of type declarations to be excluded from auto type acquisition. Ex. [\"jquery\", \"lodash\"]",
                     "type": ["array", "null"],
                     "uniqueItems": true,
                     "items": {
                        "type": "string"
                     }
                  }
               }
            }
         }
      },
      "referencesDefinition": {
         "properties": {
            "references": {
               "type": "array",
               "uniqueItems": true,
               "description": "Referenced projects. Requires TypeScript version 3.0 or later.",
               "items": {
                  "type": "object",
                  "description": "Project reference.",
                  "properties": {
                     "path": {
                        "type": "string",
                        "description": "Path to referenced tsconfig or to folder containing tsconfig."
                     }
                  }
               }
            }
         }
      },
      "tsNodeModuleTypes": {
         "type": ["object", "null"]
      },
      "tsNodeDefinition": {
         "properties": {
            "ts-node": {
               "description": "ts-node options.  See also: https://typestrong.org/ts-node/docs/configuration\n\nts-node offers TypeScript execution and REPL for node.js, with source map support.",
               "properties": {
                  "compiler": {
                     "default": "typescript",
                     "description": "Specify a custom TypeScript compiler.",
                     "type": ["string", "null"]
                  },
                  "compilerHost": {
                     "default": false,
                     "description": "Use TypeScript's compiler host API instead of the language service API.",
                     "type": ["boolean", "null"]
                  },
                  "compilerOptions": {
                     "additionalProperties": true,
                     "allOf": [
                        {
                           "$ref": "#/definitions/compilerOptionsDefinition/properties/compilerOptions"
                        }
                     ],
                     "description": "JSON object to merge with TypeScript `compilerOptions`.",
                     "properties": {},
                     "type": ["object", "null"]
                  },
                  "emit": {
                     "default": false,
                     "description": "Emit output files into `.ts-node` directory.",
                     "type": ["boolean", "null"]
                  },
                  "esm": {
                     "description": "Enable native ESM support.\n\nFor details, see https://typestrong.org/ts-node/docs/imports#native-ecmascript-modules",
                     "type": ["boolean", "null"]
                  },
                  "experimentalReplAwait": {
                     "description": "Allows the usage of top level await in REPL.\n\nUses node's implementation which accomplishes this with an AST syntax transformation.\n\nEnabled by default when tsconfig target is es2018 or above. Set to false to disable.\n\n**Note**: setting to `true` when tsconfig target is too low will throw an Error.  Leave as `undefined`\nto get default, automatic behavior.",
                     "type": ["boolean", "null"]
                  },
                  "experimentalResolver": {
                     "description": "Enable experimental features that re-map imports and require calls to support:\n`baseUrl`, `paths`, `rootDirs`, `.js` to `.ts` file extension mappings,\n`outDir` to `rootDir` mappings for composite projects and monorepos.\n\nFor details, see https://github.com/TypeStrong/ts-node/issues/1514",
                     "type": ["boolean", "null"]
                  },
                  "experimentalSpecifierResolution": {
                     "description": "Like node's `--experimental-specifier-resolution`, , but can also be set in your `tsconfig.json` for convenience.\n\nFor details, see https://nodejs.org/dist/latest-v18.x/docs/api/esm.html#customizing-esm-specifier-resolution-algorithm",
                     "enum": ["explicit", "node"],
                     "type": ["string", "null"]
                  },
                  "files": {
                     "default": false,
                     "description": "Load \"files\" and \"include\" from `tsconfig.json` on startup.\n\nDefault is to override `tsconfig.json` \"files\" and \"include\" to only include the entrypoint script.",
                     "type": ["boolean", "null"]
                  },
                  "ignore": {
                     "default": ["(?:^|/)node_modules/"],
                     "description": "Paths which should not be compiled.\n\nEach string in the array is converted to a regular expression via `new RegExp()` and tested against source paths prior to compilation.\n\nSource paths are normalized to posix-style separators, relative to the directory containing `tsconfig.json` or to cwd if no `tsconfig.json` is loaded.\n\nDefault is to ignore all node_modules subdirectories.",
                     "items": {
                        "type": "string"
                     },
                     "type": ["array", "null"]
                  },
                  "ignoreDiagnostics": {
                     "description": "Ignore TypeScript warnings by diagnostic code.",
                     "items": {
                        "type": ["string", "number"]
                     },
                     "type": ["array", "null"]
                  },
                  "logError": {
                     "default": false,
                     "description": "Logs TypeScript errors to stderr instead of throwing exceptions.",
                     "type": ["boolean", "null"]
                  },
                  "moduleTypes": {
                     "$ref": "#/definitions/tsNodeModuleTypes",
                     "description": "Override certain paths to be compiled and executed as CommonJS or ECMAScript modules.\nWhen overridden, the tsconfig \"module\" and package.json \"type\" fields are overridden, and\nthe file extension is ignored.\nThis is useful if you cannot use .mts, .cts, .mjs, or .cjs file extensions;\nit achieves the same effect.\n\nEach key is a glob pattern following the same rules as tsconfig's \"include\" array.\nWhen multiple patterns match the same file, the last pattern takes precedence.\n\n`cjs` overrides matches files to compile and execute as CommonJS.\n`esm` overrides matches files to compile and execute as native ECMAScript modules.\n`package` overrides either of the above to default behavior, which obeys package.json \"type\" and\ntsconfig.json \"module\" options."
                  },
                  "preferTsExts": {
                     "default": false,
                     "description": "Re-order file extensions so that TypeScript imports are preferred.\n\nFor example, when both `index.js` and `index.ts` exist, enabling this option causes `require('./index')` to resolve to `index.ts` instead of `index.js`",
                     "type": ["boolean", "null"]
                  },
                  "pretty": {
                     "default": false,
                     "description": "Use pretty diagnostic formatter.",
                     "type": ["boolean", "null"]
                  },
                  "require": {
                     "description": "Modules to require, like node's `--require` flag.\n\nIf specified in `tsconfig.json`, the modules will be resolved relative to the `tsconfig.json` file.\n\nIf specified programmatically, each input string should be pre-resolved to an absolute path for\nbest results.",
                     "items": {
                        "type": "string"
                     },
                     "type": ["array", "null"]
                  },
                  "scope": {
                     "default": false,
                     "description": "Scope compiler to files within `scopeDir`.",
                     "type": ["boolean", "null"]
                  },
                  "scopeDir": {
                     "default": "First of: `tsconfig.json` \"rootDir\" if specified, directory containing `tsconfig.json`, or cwd if no `tsconfig.json` is loaded.",
                     "type": ["string", "null"]
                  },
                  "skipIgnore": {
                     "default": false,
                     "description": "Skip ignore check, so that compilation will be attempted for all files with matching extensions.",
                     "type": ["boolean", "null"]
                  },
                  "swc": {
                     "description": "Transpile with swc instead of the TypeScript compiler, and skip typechecking.\n\nEquivalent to setting both `transpileOnly: true` and `transpiler: 'ts-node/transpilers/swc'`\n\nFor complete instructions: https://typestrong.org/ts-node/docs/transpilers",
                     "type": ["boolean", "null"]
                  },
                  "transpileOnly": {
                     "default": false,
                     "description": "Use TypeScript's faster `transpileModule`.",
                     "type": ["boolean", "null"]
                  },
                  "transpiler": {
                     "anyOf": [
                        {
                           "items": [
                              {
                                 "type": ["string", "null"]
                              },
                              {
                                 "additionalProperties": true,
                                 "properties": {},
                                 "type": ["object", "null"]
                              }
                           ],
                           "maxItems": 2,
                           "minItems": 2,
                           "type": ["array", "null"]
                        },
                        {
                           "type": ["string", "null"]
                        }
                     ],
                     "description": "Specify a custom transpiler for use with transpileOnly"
                  },
                  "typeCheck": {
                     "default": true,
                     "description": "**DEPRECATED** Specify type-check is enabled (e.g. `transpileOnly == false`).",
                     "type": ["boolean", "null"]
                  }
               },
               "type": ["object", "null"]
            }
         }
      }
   },
   "id": "https://json.schemastore.org/tsconfig",
   "title": "JSON schema for the TypeScript compiler's configuration file",
   "type": "object"
}
```

:::
