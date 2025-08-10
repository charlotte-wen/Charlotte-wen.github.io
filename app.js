                                                                                                                                                                                                        // 可编辑 JavaScript 课堂笔记系统（拆分自 index.html 内联脚本）

// 初始数据
let notebookData = {
  sections: [
    {
      id: 'section1',
      title: 'JavaScript基础',
      content: 'JavaScript是一种轻量级的解释型编程语言，主要用于Web开发，为网页添加交互功能。',
      notes: [
        {
          content: '注意：JavaScript 与 Java 是完全不同的语言，无论在概念上还是设计上。',
        },
      ],
      codeBlocks: [
        {
          title: '第一个JavaScript程序',
          description: '在浏览器中运行JavaScript的最简单方式：',
          code: "// 在控制台输出信息\nconsole.log(\"Hello, JavaScript!\");\n\n// 在页面上显示信息\ndocument.write(\"<h3>Welcome to JavaScript!</h3>\");\n\n// 弹出对话框\nalert(\"JavaScript is awesome!\");",
        },
      ],
    },
    {
      id: 'section2',
      title: '变量与数据类型',
      content: 'JavaScript 变量用于存储数据值。使用 var, let 或 const 来声明变量。',
      notes: [],
      codeBlocks: [
        {
          title: '变量声明示例',
          description: '',
          code: "// 使用var声明变量 (函数作用域)\nvar name = 'John';\n\n// 使用let声明变量 (块级作用域)\nlet age = 30;\n\n// 使用const声明常量\nconst PI = 3.14159;\n\n// 数据类型示例\nlet isStudent = true; // 布尔值\nlet fruits = ['Apple', 'Banana', 'Orange']; // 数组\nlet person = {firstName: 'Jane', lastName: 'Doe'}; // 对象\nlet emptyValue = null; // null\nlet notDefined; // undefined\n\nconsole.log(`Name: ${name}, Age: ${age}`);\nconsole.log(`PI: ${PI}, Is student: ${isStudent}`);\nconsole.log(`Fruits: ${fruits.join(', ')}`);\nconsole.log(`Person: ${person.firstName} ${person.lastName}`);",
        },
        {
          title: '错误处理示例',
          description: '演示不同类型的JavaScript错误以及严格模式的效果：',
          code: "// 1. 正常代码（会成功执行）\nconsole.log('这是正常的代码执行');\n\n// 2. 取消下面的注释来测试不同类型的错误：\n\n// 语法错误示例（取消注释测试）：\n// let x = ;\n\n// 引用错误示例（取消注释测试）：\n// console.log(undefinedVariable);\n\n// 类型错误示例（取消注释测试）：\n// let num = null;\n// num.toUpperCase();\n\n// 严格模式错误示例（取消注释测试）：\n// 在严格模式下，未声明的变量会报错\n// strictModeTest = '这会在严格模式下报错';\n\nconsole.log('代码执行完成！');",
        },
      ],
    },
  ],
};

// CodeMirror 实例
let codeEditors = [];

// DOM 元素
const mainContent = document.getElementById('mainContent');
const tocList = document.getElementById('tocList');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const emptyState = document.getElementById('emptyState');
const addFirstSectionBtn = document.getElementById('addFirstSectionBtn');

function initApp() {
  const savedData = localStorage.getItem('jsNotebook');
  if (savedData) {
    try {
      notebookData = JSON.parse(savedData);
      // 清理被过度转义的代码
      cleanupEscapedCode();
      // 验证和修复章节ID
      validateAndFixSectionIds();
    } catch (e) {
      console.error('Error parsing saved data', e);
    }
  }

  renderToc();
  renderContent();
  setupEventListeners();
}

function validateAndFixSectionIds() {
  let hasChanges = false;
  
  // 确保所有章节都有有效的ID
  notebookData.sections.forEach((section, index) => {
    if (!section.id || section.id.trim() === '') {
      // 生成新的唯一ID
      let newId = `section${index + 1}`;
      let counter = index + 1;
      while (notebookData.sections.some((s, i) => i !== index && s.id === newId)) {
        counter++;
        newId = `section${counter}`;
      }
      section.id = newId;
      console.log(`修复章节ID: ${section.title} -> ${newId}`);
      hasChanges = true;
    }
  });
  
  // 检查是否有重复的ID
  const ids = notebookData.sections.map(s => s.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    console.warn('发现重复的章节ID，正在修复...', duplicates);
    notebookData.sections.forEach((section, index) => {
      if (duplicates.includes(section.id)) {
        let newId = `section${index + 1}`;
        let counter = index + 1;
        while (notebookData.sections.some((s, i) => i !== index && s.id === newId)) {
          counter++;
          newId = `section${counter}`;
        }
        section.id = newId;
        console.log(`修复重复ID: ${section.title} -> ${newId}`);
      }
    });
    hasChanges = true;
  }
  
  // 如果有任何修复，保存数据
  if (hasChanges) {
    localStorage.setItem('jsNotebook', JSON.stringify(notebookData));
    console.log('章节ID修复完成，数据已保存');
  }
}

function cleanupEscapedCode() {
  // 清理被过度转义的代码内容
  notebookData.sections.forEach(section => {
    if (section.codeBlocks) {
      section.codeBlocks.forEach(codeBlock => {
        if (codeBlock.code) {
          let code = codeBlock.code;
          
          // 多次清理，处理深度嵌套的转义
          let prevCode;
          do {
            prevCode = code;
            code = code
              .replace(/\\\\\\\\/g, '\\\\')  // 四个反斜杠变两个
              .replace(/\\\\\\\\/g, '\\\\')  // 再次处理四个反斜杠变两个
              .replace(/\\\\\\\$/g, '\\$')   // 三个反斜杠+$变一个反斜杠+$
              .replace(/\\\\\\\`/g, '\\`')   // 三个反斜杠+`变一个反斜杠+`
              .replace(/\\\\\\\{/g, '\\{')   // 三个反斜杠+{变一个反斜杠+{
              .replace(/\\\\\$/g, '$')       // 两个反斜杠+$变$
              .replace(/\\\\\`/g, '`')       // 两个反斜杠+`变`
              .replace(/\\\\\{/g, '{')       // 两个反斜杠+{变{
              .replace(/\\\$/g, '$')         // 一个反斜杠+$变$
              .replace(/\\\`/g, '`')         // 一个反斜杠+`变`
              .replace(/\\\{/g, '{')         // 一个反斜杠+{变{
              .replace(/\\\$\\\{/g, '${')    // \$\{变${
              .replace(/\\\\\$\\\\\{/g, '${'); // \\$\\{变${
          } while (code !== prevCode); // 重复直到没有变化
          
          codeBlock.code = code;
        }
      });
    }
  });
}

function escapeForTemplate(str) {
  // 专用于文本内容（标题、描述等），不用于代码内容
  const s = String(str);
  const endScript = new RegExp('</scr' + 'ipt>', 'gi');
  return s.replace(endScript, '</scr' + 'ipt>');
}

function escapeForHtmlAttribute(str) {
  // 专门为HTML属性转义，避免破坏代码内容
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderToc() {
  tocList.innerHTML = '';
  if (notebookData.sections.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  notebookData.sections.forEach((section, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="#${section.id}" class="toc-link ${index === 0 ? 'active' : ''}" data-section-id="${section.id}">${escapeForTemplate(section.title)}</a>
      <div class="toc-actions">
        <button class="toc-btn move-up-btn" data-id="${section.id}" ${index === 0 ? 'disabled="disabled"' : ''}><i class="fas fa-arrow-up"></i></button>
        <button class="toc-btn move-down-btn" data-id="${section.id}" ${index === notebookData.sections.length - 1 ? 'disabled="disabled"' : ''}><i class="fas fa-arrow-down"></i></button>
        <button class="toc-btn delete-btn" data-id="${section.id}"><i class="fas fa-trash"></i></button>
      </div>`;
    tocList.appendChild(li);
  });
}

function renderContent() {
  mainContent.innerHTML = '';
  codeEditors = [];
  if (notebookData.sections.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  notebookData.sections.forEach((section, sectionIndex) => {
    const sectionEl = document.createElement('section');
    sectionEl.id = section.id;
    sectionEl.className = 'section note-section';

    let notesHtml = '';
    if (section.notes && section.notes.length > 0) {
      section.notes.forEach((note) => {
        notesHtml += `
          <div class="note-box">
            <strong><i class="fas fa-lightbulb"></i> 注意：</strong>
            <span class="editable" contenteditable="true">${escapeForTemplate(note.content)}</span>
          </div>`;
      });
    }

    let codeBlocksHtml = '';
    if (section.codeBlocks && section.codeBlocks.length > 0) {
      section.codeBlocks.forEach((codeBlock, codeIndex) => {
        codeBlocksHtml += `
          <h3><i class="fas fa-code"></i> <span class="editable code-title" contenteditable="true">${escapeForTemplate(codeBlock.title)}</span></h3>
          ${codeBlock.description ? `<p class="editable" contenteditable="true">${escapeForTemplate(codeBlock.description)}</p>` : ''}
          <div class="code-container">
            <div class="code-header">
              <span>示例代码 ${sectionIndex + 1}.${codeIndex + 1}</span>
              <div class="code-actions">
                <button class="copy-code-btn"><i class="fas fa-copy"></i> 复制代码</button>
                <button class="run-btn"><i class="fas fa-play"></i> 运行代码</button>
                <button class="clear-output-btn"><i class="fas fa-eraser"></i> 清除结果</button>
                <button class="move-code-up-btn" data-section="${sectionIndex}" data-index="${codeIndex}" ${codeIndex === 0 ? 'disabled="disabled"' : ''}><i class="fas fa-arrow-up"></i></button>
                <button class="move-code-down-btn" data-section="${sectionIndex}" data-index="${codeIndex}" ${codeIndex === section.codeBlocks.length - 1 ? 'disabled="disabled"' : ''}><i class="fas fa-arrow-down"></i></button>
                <button class="btn btn-danger delete-code-btn" data-section="${sectionIndex}" data-index="${codeIndex}"><i class="fas fa-trash"></i></button>
              </div>
            </div>
            <textarea class="code-editor" id="editor-${sectionIndex}-${codeIndex}" style="display: none;">${escapeForHtmlAttribute(codeBlock.code)}</textarea>
            <div class="output-container">
              <div class="output-title"><i class="fas fa-terminal"></i> 输出结果：</div>
              <div class="output-content"></div>
            </div>
          </div>`;
      });
    }

    sectionEl.innerHTML = `
      <div class="section-actions">
        <button class="section-btn add-note-btn" data-section="${sectionIndex}"><i class="fas fa-sticky-note"></i> 添加注释</button>
        <button class="section-btn add-code-btn" data-section="${sectionIndex}"><i class="fas fa-code"></i> 添加代码</button>
        <button class="section-btn delete-section-btn" data-section="${sectionIndex}"><i class="fas fa-trash"></i> 删除章节</button>
      </div>
      <h2><i class="fas fa-star"></i> <span class="editable" contenteditable="true">${escapeForTemplate(section.title)}</span></h2>
      <p class="editable" contenteditable="true">${escapeForTemplate(section.content)}</p>
      ${notesHtml}
      ${codeBlocksHtml}
      <div class="code-container add-code-container" style="margin-top: 30px; text-align: center; background: #f8f9fa; border: 2px dashed #3498db; cursor: pointer;" data-section="${sectionIndex}">
        <div style="padding: 30px; color: #3498db;">
          <i class="fas fa-plus-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <h3>添加新的代码示例</h3>
        </div>
      </div>`;

    mainContent.appendChild(sectionEl);
  });

  setTimeout(() => {
    document.querySelectorAll('.code-editor').forEach((textarea) => {
      const editor = CodeMirror.fromTextArea(textarea, {
        mode: 'javascript',
        theme: 'dracula',
        lineNumbers: true,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        extraKeys: {
          "Ctrl-/": function(cm) { toggleComment(cm); },
          "Cmd-/": function(cm) { toggleComment(cm); } // Mac支持
        }
      });
      codeEditors.push(editor);
    });
  }, 100);
}

function setupEventListeners() {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  document.getElementById('newSectionBtn').addEventListener('click', addNewSection);
  addFirstSectionBtn.addEventListener('click', addNewSection);

      document.getElementById('saveBtn').addEventListener('click', saveNotebook);
    document.getElementById('exportBtn').addEventListener('click', exportHtml);

    // 修复代码按钮
      document.getElementById('fixCodeBtn').addEventListener('click', () => {
    cleanupEscapedCode();
    saveNotebookData(); // 保存清理后的数据
    renderContent(); // 重新渲染内容
    showNotification('代码转义问题已修复！', 'success');
  });

  // 回到顶部按钮功能
  const backToTopBtn = document.getElementById('backToTopBtn');
  
  // 监听页面滚动
  window.addEventListener('scroll', () => {
    // 回到顶部按钮显示/隐藏
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
    
    // 自动更新目录中的活跃章节
    updateActiveTocItem();
  });

  // 点击回到顶部
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // 双击回到顶部（立即滚动，无动画）
  backToTopBtn.addEventListener('dblclick', () => {
    window.scrollTo({
      top: 0,
      behavior: 'auto'
    });
  });

  // 目录章节跳转功能
  tocList.addEventListener('click', (e) => {
    if (e.target.closest('.toc-link')) {
      e.preventDefault(); // 阻止默认的锚点跳转
      
      const link = e.target.closest('.toc-link');
      const sectionId = link.dataset.sectionId;
      const targetSection = document.getElementById(sectionId);
      
      if (targetSection) {
        // 平滑滚动到目标章节
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // 更新活跃状态
        document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // 在移动设备上自动关闭侧边栏
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('show');
          sidebarToggle.querySelector('i').className = 'fas fa-bars';
        }
      } else {
        // 显示错误提示
        showNotification(`无法找到章节: ${sectionId}`, 'error');
      }
    }
  });

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('确定要重置所有内容吗？这将清除所有自定义内容。')) {
        localStorage.removeItem('jsNotebook');
        location.reload();
      }
    });

  document.getElementById('newTocBtn').addEventListener('click', addNewSection);

  mainContent.addEventListener('click', (e) => {
    if (e.target.closest('.copy-code-btn')) {
      const codeContainer = e.target.closest('.code-container');
      const editorArea = codeContainer.querySelector('.CodeMirror');
      
      if (editorArea && editorArea.CodeMirror) {
        const code = editorArea.CodeMirror.getValue();
        
        // 使用现代剪贴板API或回退到传统方法
        if (navigator.clipboard && window.isSecureContext) {
          // 现代浏览器的异步剪贴板API
          navigator.clipboard.writeText(code).then(() => {
            showCopySuccess(e.target.closest('.copy-code-btn'));
          }).catch(err => {
            console.error('复制失败:', err);
            // 回退到传统方法
            fallbackCopyToClipboard(code, e.target.closest('.copy-code-btn'));
          });
        } else {
          // 传统的复制方法
          fallbackCopyToClipboard(code, e.target.closest('.copy-code-btn'));
        }
      } else {
        showNotification('无法获取代码内容', 'error');
      }
    }

    if (e.target.closest('.run-btn')) {
      const codeContainer = e.target.closest('.code-container');
      const outputContainer = codeContainer.querySelector('.output-container');
      const outputContent = outputContainer.querySelector('.output-content');
      outputContainer.style.display = 'block';
      outputContent.innerHTML = '';
      const originalLog = console.log;
      console.log = function (...args) {
        originalLog.apply(console, args);
        args.forEach((arg) => {
          outputContent.innerHTML += `<div>${String(arg)}</div>`;
        });
      };
      try {
        const editorArea = codeContainer.querySelector('.CodeMirror');
        const code = editorArea ? editorArea.CodeMirror.getValue() : '';
        
        // 确保代码在严格模式下运行
        const strictCode = `'use strict';\n${code}`;
        
        // 创建函数并执行
        const result = new Function(strictCode);
        result();
        
        // 如果代码执行成功但没有输出，显示成功消息
        if (outputContent.innerHTML.trim() === '') {
          outputContent.innerHTML = '<div style="color: #27ae60;"><i class="fas fa-check-circle"></i> 代码执行成功（无输出）</div>';
        }
      } catch (error) {
        // 详细的错误处理
        let errorMessage = error.message;
        let errorType = error.name || '错误';
        
        // 常见错误类型的中文提示
        if (error instanceof SyntaxError) {
          errorType = '语法错误';
        } else if (error instanceof ReferenceError) {
          errorType = '引用错误';
        } else if (error instanceof TypeError) {
          errorType = '类型错误';
        } else if (error instanceof RangeError) {
          errorType = '范围错误';
        }
        
        outputContent.innerHTML = `
          <div style="color: var(--danger); padding: 10px; background: rgba(231, 76, 60, 0.1); border-radius: 5px; border-left: 4px solid var(--danger);">
            <div style="font-weight: bold; margin-bottom: 5px;">
              <i class="fas fa-exclamation-triangle"></i> ${errorType}
            </div>
            <div style="font-family: monospace; font-size: 0.9em;">
              ${errorMessage}
            </div>
          </div>
        `;
      } finally {
        console.log = originalLog;
      }
    }

    if (e.target.closest('.clear-output-btn')) {
      const codeContainer = e.target.closest('.code-container');
      const outputContainer = codeContainer.querySelector('.output-container');
      const outputContent = outputContainer.querySelector('.output-content');
      outputContent.innerHTML = '';
      outputContainer.style.display = 'none';
    }

    if (e.target.closest('.add-note-btn')) {
      const sectionIndex = e.target.closest('.add-note-btn').dataset.section;
      addNoteToSection(parseInt(sectionIndex));
    }

    if (e.target.closest('.add-code-btn') || e.target.closest('.add-code-container')) {
      const btn = e.target.closest('.add-code-btn') || e.target.closest('.add-code-container');
      const sectionIndex = btn.dataset.section;
      addCodeBlockToSection(parseInt(sectionIndex));
    }

    if (e.target.closest('.delete-code-btn')) {
      const btn = e.target.closest('.delete-code-btn');
      const sectionIndex = parseInt(btn.dataset.section);
      const codeIndex = parseInt(btn.dataset.index);
      if (confirm('确定要删除这个代码示例吗？')) {
        notebookData.sections[sectionIndex].codeBlocks.splice(codeIndex, 1);
        saveNotebook();
        renderContent();
      }
    }

    if (e.target.closest('.move-code-up-btn')) {
      const btn = e.target.closest('.move-code-up-btn');
      if (btn.disabled) return; // 如果按钮被禁用，直接返回
      const sectionIndex = parseInt(btn.dataset.section);
      const codeIndex = parseInt(btn.dataset.index);
      if (codeIndex > 0) {
        const codeBlocks = notebookData.sections[sectionIndex].codeBlocks;
        [codeBlocks[codeIndex - 1], codeBlocks[codeIndex]] = 
        [codeBlocks[codeIndex], codeBlocks[codeIndex - 1]];
        saveNotebookData();
        renderContent();
        showNotification('代码示例已向上移动！', 'success');
      }
    }

    if (e.target.closest('.move-code-down-btn')) {
      const btn = e.target.closest('.move-code-down-btn');
      if (btn.disabled) return; // 如果按钮被禁用，直接返回
      const sectionIndex = parseInt(btn.dataset.section);
      const codeIndex = parseInt(btn.dataset.index);
      const codeBlocks = notebookData.sections[sectionIndex].codeBlocks;
      if (codeIndex < codeBlocks.length - 1) {
        [codeBlocks[codeIndex], codeBlocks[codeIndex + 1]] = 
        [codeBlocks[codeIndex + 1], codeBlocks[codeIndex]];
        saveNotebookData();
        renderContent();
        showNotification('代码示例已向下移动！', 'success');
      }
    }

    if (e.target.closest('.delete-section-btn')) {
      const sectionIndex = e.target.closest('.delete-section-btn').dataset.section;
      if (notebookData.sections.length > 1 && confirm('确定要删除这个章节吗？')) {
        notebookData.sections.splice(sectionIndex, 1);
        saveNotebookData();
        renderToc();
        renderContent();
      } else if (notebookData.sections.length === 1) {
        alert('至少需要保留一个章节');
      }
    }
  });

  tocList.addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) {
      const sectionId = e.target.closest('.delete-btn').dataset.id;
      const sectionIndex = notebookData.sections.findIndex((s) => s.id === sectionId);
      if (notebookData.sections.length > 1 && confirm('确定要删除这个章节吗？')) {
        notebookData.sections.splice(sectionIndex, 1);
        saveNotebookData();
        renderToc();
        renderContent();
      } else if (notebookData.sections.length === 1) {
        alert('至少需要保留一个章节');
      }
    }

    if (e.target.closest('.move-up-btn')) {
      const btn = e.target.closest('.move-up-btn');
      if (btn.disabled) return; // 如果按钮被禁用，直接返回
      const sectionId = btn.dataset.id;
      const sectionIndex = notebookData.sections.findIndex((s) => s.id === sectionId);
      if (sectionIndex > 0) {
        [notebookData.sections[sectionIndex - 1], notebookData.sections[sectionIndex]] = 
        [notebookData.sections[sectionIndex], notebookData.sections[sectionIndex - 1]];
        saveNotebookData();
        renderToc();
        renderContent();
      }
    }

    if (e.target.closest('.move-down-btn')) {
      const btn = e.target.closest('.move-down-btn');
      if (btn.disabled) return; // 如果按钮被禁用，直接返回
      const sectionId = btn.dataset.id;
      const sectionIndex = notebookData.sections.findIndex((s) => s.id === sectionId);
      if (sectionIndex < notebookData.sections.length - 1) {
        [notebookData.sections[sectionIndex], notebookData.sections[sectionIndex + 1]] = 
        [notebookData.sections[sectionIndex + 1], notebookData.sections[sectionIndex]];
        saveNotebookData();
        renderToc();
        renderContent();
      }
    }

    if (e.target.closest('.toc a')) {
      e.preventDefault();
      const targetId = e.target.closest('.toc a').getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({ top: targetElement.offsetTop - 20, behavior: 'smooth' });
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
        }
      }
    }
  });

  // 实时保存编辑内容（防抖）
  let saveTimeout;
  mainContent.addEventListener('input', (e) => {
    if (e.target.classList.contains('editable')) {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveEditableContent();
        // 立即保存到localStorage
        localStorage.setItem('jsNotebook', JSON.stringify(notebookData));
      }, 1000);
      
      // 如果是章节标题发生变化，立即更新目录
      if (e.target.closest('h2') && e.target.classList.contains('editable')) {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          saveEditableContent();
          localStorage.setItem('jsNotebook', JSON.stringify(notebookData));
        }, 500); // 章节标题变化时使用更短的延迟
      }
    }
  });

  // 添加键盘快捷键
  document.addEventListener('keydown', (e) => {
    // Ctrl+S 保存笔记
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault(); // 阻止浏览器默认的保存页面行为
      saveNotebook();
      return;
    }
    
    // Ctrl+N 添加新章节
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      addNewSection();
      return;
    }
    
    // Ctrl+E 导出HTML
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      exportHtml();
      return;
    }
    
    // F1 显示快捷键帮助
    if (e.key === 'F1') {
      e.preventDefault();
      showKeyboardShortcuts();
      return;
    }
  });
}

function addNewSection() {
  // 生成唯一的章节ID，避免重复
  let newSectionId;
  let sectionCount = 1;
  do {
    newSectionId = `section${sectionCount}`;
    sectionCount++;
  } while (notebookData.sections.some(s => s.id === newSectionId));
  
  const newSection = {
    id: newSectionId,
    title: `新章节 ${notebookData.sections.length + 1}`,
    content: '在此处添加章节描述...',
    notes: [],
    codeBlocks: [
      {
        title: '示例代码',
        description: '在此处添加代码描述',
        code: "// 在此处添加您的JavaScript代码\nconsole.log('Hello, JavaScript!');",
      },
    ],
  };
  notebookData.sections.push(newSection);
  saveNotebook();
  renderToc();
  renderContent();
  
  // 确保DOM更新后再滚动到新章节
  setTimeout(() => {
    const targetElement = document.getElementById(newSectionId);
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // 更新目录中的活跃状态
      document.querySelectorAll('.toc-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.sectionId === newSectionId) {
          link.classList.add('active');
        }
      });
      
      // 在移动设备上自动关闭侧边栏
      if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        sidebar.classList.remove('show');
        sidebarToggle.querySelector('i').className = 'fas fa-bars';
      }
    } else {
      // 如果找不到元素，尝试用更长的延迟再次查找
      setTimeout(() => {
        const retryElement = document.getElementById(newSectionId);
        if (retryElement) {
          retryElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          
          // 更新目录中的活跃状态
          document.querySelectorAll('.toc-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.sectionId === newSectionId) {
              link.classList.add('active');
            }
          });
        }
      }, 500);
    }
  }, 100); // 先用较短的延迟尝试
}

function addNoteToSection(sectionIndex) {
  if (!notebookData.sections[sectionIndex].notes) {
    notebookData.sections[sectionIndex].notes = [];
  }
  
  // 记录当前滚动位置
  const currentScrollY = window.pageYOffset;
  
  notebookData.sections[sectionIndex].notes.push({ content: '在此处添加重要注释...' });
  saveNotebook();
  renderContent();
  
  // 在内容重新渲染后，保持在合适的位置
  setTimeout(() => {
    const section = document.getElementById(notebookData.sections[sectionIndex].id);
    if (section) {
      // 找到该章节的最后一个注释框（新添加的）
      const noteBoxes = section.querySelectorAll('.note-box');
      const newNoteBox = noteBoxes[noteBoxes.length - 1];
      
      if (newNoteBox) {
        // 平滑滚动到新添加的注释
        newNoteBox.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      } else {
        // 如果找不到新注释，保持在当前位置
        window.scrollTo({
          top: currentScrollY,
          behavior: 'auto'
        });
      }
    } else {
      // 如果找不到章节，保持在当前位置
      window.scrollTo({
        top: currentScrollY,
        behavior: 'auto'
      });
    }
  }, 200);
}

function addCodeBlockToSection(sectionIndex) {
  if (!notebookData.sections[sectionIndex].codeBlocks) {
    notebookData.sections[sectionIndex].codeBlocks = [];
  }
  
  // 记录当前滚动位置
  const currentScrollY = window.pageYOffset;
  
  const codeBlockCount = notebookData.sections[sectionIndex].codeBlocks.length + 1;
  notebookData.sections[sectionIndex].codeBlocks.push({
    title: `新代码示例 ${codeBlockCount}`,
    description: '在此处添加代码描述',
    code: "// 在此处添加您的JavaScript代码\nconsole.log('Hello, JavaScript!');",
  });
  saveNotebook();
  renderContent();
  
  // 在内容重新渲染后，滚动到新添加的代码块
  setTimeout(() => {
    const section = document.getElementById(notebookData.sections[sectionIndex].id);
    if (section) {
      // 找到该章节的最后一个代码容器（新添加的）
      const codeContainers = section.querySelectorAll('.code-container:not(.add-code-container)');
      const newCodeContainer = codeContainers[codeContainers.length - 1];
      
      if (newCodeContainer) {
        // 平滑滚动到新添加的代码块
        newCodeContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      } else {
        // 如果找不到新代码块，至少保持在当前位置
        window.scrollTo({
          top: currentScrollY,
          behavior: 'auto'
        });
      }
    } else {
      // 如果找不到章节，保持在当前位置
      window.scrollTo({
        top: currentScrollY,
        behavior: 'auto'
      });
    }
  }, 200); // 稍微增加延迟确保DOM完全更新
}

function saveEditableContent() {
  let titleChanged = false;
  
  document.querySelectorAll('.section').forEach((sectionEl, sectionIndex) => {
    const titleEl = sectionEl.querySelector('h2 .editable');
    const contentEl = sectionEl.querySelector('p.editable');
    if (titleEl && contentEl) {
      const oldTitle = notebookData.sections[sectionIndex].title;
      const newTitle = titleEl.textContent;
      
      notebookData.sections[sectionIndex].title = newTitle;
      notebookData.sections[sectionIndex].content = contentEl.textContent;
      
      // 检查标题是否发生变化
      if (oldTitle !== newTitle) {
        titleChanged = true;
      }
    }
    const noteEls = sectionEl.querySelectorAll('.note-box .editable');
    noteEls.forEach((noteEl, noteIndex) => {
      if (notebookData.sections[sectionIndex].notes[noteIndex]) {
        notebookData.sections[sectionIndex].notes[noteIndex].content = noteEl.textContent;
      }
    });
    // 保存代码块标题
    const codeTitleEls = sectionEl.querySelectorAll('.code-title.editable');
    codeTitleEls.forEach((titleEl, titleIndex) => {
      if (notebookData.sections[sectionIndex].codeBlocks[titleIndex]) {
        notebookData.sections[sectionIndex].codeBlocks[titleIndex].title = titleEl.textContent;
      }
    });
    
    // 保存代码描述
    const codeDescEls = sectionEl.querySelectorAll('.code-container p.editable');
    codeDescEls.forEach((descEl, descIndex) => {
      if (notebookData.sections[sectionIndex].codeBlocks[descIndex]) {
        notebookData.sections[sectionIndex].codeBlocks[descIndex].description = descEl.textContent;
      }
    });
  });

  // 保存代码内容
  codeEditors.forEach((editor, index) => {
    const editorId = editor.getTextArea().id;
    const [_, sectionIndex, codeIndex] = editorId.split('-');
    if (notebookData.sections[sectionIndex] && notebookData.sections[sectionIndex].codeBlocks[codeIndex]) {
      notebookData.sections[sectionIndex].codeBlocks[codeIndex].code = editor.getValue();
    }
  });
  
  // 如果标题发生变化，重新渲染目录
  if (titleChanged) {
    renderToc();
  }
}

function saveNotebook() {
  saveEditableContent();
  localStorage.setItem('jsNotebook', JSON.stringify(notebookData));
  showNotification('笔记已保存！', 'success');
}

function saveNotebookData() {
  // 只保存数据，不保存可编辑内容（用于上下移动等操作）
  localStorage.setItem('jsNotebook', JSON.stringify(notebookData));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function exportHtml() {
  saveEditableContent();
  let htmlParts = [];
  htmlParts.push('<!DOCTYPE html>');
  htmlParts.push('<html lang="zh-CN">');
  htmlParts.push('<head>');
  htmlParts.push('<meta charset="UTF-8">');
  htmlParts.push('<title>JavaScript课堂笔记 - ' + new Date().toLocaleDateString() + '</title>');
  htmlParts.push('<meta name="description" content="JavaScript课堂笔记系统，包含代码示例、运行环境和交互功能">');
  htmlParts.push('<meta name="keywords" content="JavaScript, 编程, 学习, 代码示例, 课堂笔记">');
  htmlParts.push('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
  htmlParts.push('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/dracula.min.css">');
  htmlParts.push('<style>');
  
  // 内联完整的CSS样式
  htmlParts.push(`
:root {
    --primary: #4b6cb7;
    --secondary: #182848;
    --accent: #ffd700;
    --light: #f8f9fa;
    --dark: #2c3e50;
    --success: #27ae60;
    --danger: #e74c3c;
    --warning: #f39c12;
    --info: #3498db;
    --border-radius: 8px;
    --shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    --transition: all 0.3s ease;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c);
    background-attachment: fixed;
    color: #333;
    line-height: 1.6;
    min-height: 100vh;
    padding: 20px;
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.97);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 95vh;
}

header {
    background: linear-gradient(90deg, var(--primary), var(--secondary));
    color: white;
    padding: 25px 40px;
    text-align: center;
    border-bottom: 4px solid var(--accent);
    position: relative;
}

.header-content {
    max-width: 800px;
    margin: 0 auto;
}

h1 {
    font-size: 2.8rem;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    margin: 0 auto 15px;
}

.actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 20px;
}

.btn {
    background: var(--accent);
    color: var(--dark);
    border: none;
    padding: 10px 20px;
    border-radius: 50px;
    font-weight: bold;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.btn i { font-size: 1.1rem; }
.btn-primary { background: var(--primary); color: white; }
.btn-success { background: var(--success); color: white; }
.btn-warning { background: var(--warning); color: white; }
.btn-info { background: var(--info); color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn-secondary:hover { background: #5a6268; }

.content-wrapper { 
    display: flex; 
    flex: 1; 
    min-height: 75vh; 
}

.sidebar {
    width: 280px;
    background: var(--dark);
    color: white;
    padding: 25px 20px;
    overflow-y: auto;
    transition: var(--transition);
}

.sidebar h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--primary);
    color: var(--accent);
}

.toc { 
    list-style: none; 
}

.toc li {
    margin: 12px 0;
    padding-left: 15px;
    position: relative;
}

.toc li:before {
    content: "•";
    position: absolute;
    left: 0;
    color: var(--primary);
    font-size: 1.4rem;
    top: -3px;
}

.toc a {
    color: #ecf0f1;
    text-decoration: none;
    display: block;
    padding: 12px 15px;
    border-radius: 5px;
    cursor: pointer;
    transition: var(--transition);
    font-size: 1.05rem;
}

.toc a:hover { 
    background: var(--primary); 
    color: white; 
    transform: translateX(5px); 
}

.toc a.active { 
    background: var(--primary); 
    color: white; 
    font-weight: bold; 
    border-left: 4px solid var(--accent);
    transform: translateX(5px);
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.main-content { 
    flex: 1; 
    padding: 30px 40px; 
    overflow-y: auto; 
}

.section {
    margin-bottom: 50px;
    padding: 25px;
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    border-left: 4px solid var(--primary);
    transition: var(--transition);
    position: relative;
}

.section:hover { 
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12); 
}

.section h2 { 
    color: var(--dark); 
    margin-bottom: 20px; 
    padding-bottom: 10px; 
    border-bottom: 2px solid #ecf0f1; 
    display: flex; 
    align-items: center; 
    gap: 12px; 
}

.section h2 i { 
    color: var(--primary); 
    font-size: 1.8rem; 
}

.section h3 { 
    color: var(--primary); 
    margin: 25px 0 15px; 
    display: flex; 
    align-items: center; 
    gap: 10px; 
}

.section h3 i { 
    font-size: 1.3rem; 
}

.note-box { 
    background: var(--light); 
    border-left: 4px solid var(--accent); 
    padding: 18px; 
    margin: 20px 0; 
    border-radius: 0 var(--border-radius) var(--border-radius) 0; 
}

.code-container { 
    position: relative; 
    margin: 25px 0; 
    border-radius: var(--border-radius); 
    overflow: hidden; 
    box-shadow: var(--shadow); 
}

.code-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    background: #1e1e1e; 
    padding: 10px 15px; 
    color: #ccc; 
    font-family: monospace; 
    font-size: 0.9rem; 
}

.code-actions { 
    display: flex; 
    gap: 10px; 
}

.copy-code-btn, .run-btn, .clear-output-btn { 
    background: var(--success); 
    color: white; 
    border: none; 
    padding: 8px 15px; 
    border-radius: 5px; 
    cursor: pointer; 
    font-weight: bold; 
    transition: var(--transition); 
    display: flex; 
    align-items: center; 
    gap: 5px; 
}

.copy-code-btn:hover, .run-btn:hover, .clear-output-btn:hover { 
    background: #2ecc71; 
    transform: translateY(-2px); 
}

.run-btn { 
    background: var(--info); 
}

.run-btn:hover { 
    background: #2980b9; 
}

.clear-output-btn {
    background: var(--warning);
}

.clear-output-btn:hover {
    background: #f39c12;
}

pre {
    background: #1e1e1e;
    color: #f8f8f2;
    padding: 20px;
    overflow-x: auto;
    margin: 0;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
}

code {
    background: none;
    color: inherit;
    padding: 0;
}

.output-container { 
    background: var(--dark); 
    color: #ecf0f1; 
    padding: 15px; 
    border-radius: 0 0 var(--border-radius) var(--border-radius); 
    margin-top: -5px; 
    font-family: monospace; 
    min-height: 60px; 
    display: none; 
}

.output-title { 
    color: var(--accent); 
    margin-bottom: 10px; 
    font-weight: bold; 
    display: flex; 
    align-items: center; 
    gap: 8px; 
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success);
    color: white;
    padding: 15px 20px;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    z-index: 1000;
    transform: translateX(400px);
    transition: var(--transition);
    max-width: 300px;
}

.notification.show {
    transform: translateX(0);
}

.notification.success { background: var(--success); }
.notification.error { background: var(--danger); }
.notification.info { background: var(--info); }

.notification .notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.back-to-top {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: var(--primary);
    color: white;
    border: none;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: var(--transition);
    z-index: 1000;
}

.back-to-top:hover {
    background: var(--secondary);
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.back-to-top:active {
    transform: translateY(-1px);
}

footer { 
    text-align: center; 
    padding: 20px; 
    background: var(--secondary); 
    color: #ecf0f1; 
    font-size: 0.9rem; 
}

@media (max-width: 768px) {
    .sidebar { 
        width: 100%; 
        margin-bottom: 20px; 
    }
    
    .content-wrapper { 
        flex-direction: column; 
    }
    
    .main-content { 
        padding: 20px; 
    }
    
    h1 { 
        font-size: 2.2rem; 
    }
    
    .actions {
        flex-direction: column;
        align-items: center;
    }
    
    .btn {
        width: 100%;
        max-width: 300px;
        justify-content: center;
    }
}

@media (max-width: 576px) {
    header { 
        padding: 20px 15px; 
    }
    
    h1 { 
        font-size: 1.8rem; 
    }
    
    .section { 
        padding: 20px 15px; 
    }
}
  `);
  
  htmlParts.push('</style>');
  htmlParts.push('</head>');
  htmlParts.push('<body>');
  htmlParts.push('<div class="container">');
  htmlParts.push('<header>');
  htmlParts.push('<div class="header-content">');
  htmlParts.push('<h1><i class="fas fa-code"></i> JavaScript课堂笔记</h1>');
  htmlParts.push('<p class="subtitle">导出时间：' + new Date().toLocaleString() + ' | 包含 ' + notebookData.sections.length + ' 个章节</p>');
  htmlParts.push('<div class="stats" style="margin-top: 15px; font-size: 0.9rem; opacity: 0.8;">');
  htmlParts.push('<span style="margin-right: 20px;"><i class="fas fa-code"></i> 代码块：' + (notebookData.sections.reduce((total, section) => total + (section.codeBlocks ? section.codeBlocks.length : 0), 0)) + ' 个</span>');
  htmlParts.push('<span><i class="fas fa-lightbulb"></i> 注意事项：' + (notebookData.sections.reduce((total, section) => total + (section.notes ? section.notes.length : 0), 0)) + ' 条</span>');
  htmlParts.push('</div>');
  htmlParts.push('</div>');
  htmlParts.push('</header>');
  htmlParts.push('<div class="content-wrapper">');
  htmlParts.push('<aside class="sidebar">');
  htmlParts.push('<h2><i class="fas fa-book"></i> 课程目录</h2>');
  htmlParts.push('<ul class="toc">');
  notebookData.sections.forEach((section, index) => {
    htmlParts.push('<li>');
    htmlParts.push('<a href="#' + section.id + '"' + (index === 0 ? ' class="active"' : '') + '>');
    htmlParts.push(escapeHtml(section.title || ''));
    htmlParts.push('</a>');
    htmlParts.push('</li>');
  });
  htmlParts.push('</ul>');
  htmlParts.push('</aside>');
  htmlParts.push('<main class="main-content">');
  notebookData.sections.forEach((section) => {
    htmlParts.push('<section id="' + section.id + '" class="section">');
    htmlParts.push('<h2><i class="fas fa-star"></i> ' + escapeHtml(section.title || '') + '</h2>');
    htmlParts.push('<p>' + escapeHtml(section.content || '') + '</p>');
    if (section.notes && section.notes.length > 0) {
      section.notes.forEach((note) => {
        htmlParts.push('<div class="note-box">');
        htmlParts.push('<strong><i class="fas fa-lightbulb"></i> 注意：</strong> ');
        htmlParts.push(escapeHtml(note.content || ''));
        htmlParts.push('</div>');
      });
    }
    if (section.codeBlocks && section.codeBlocks.length > 0) {
      section.codeBlocks.forEach((codeBlock) => {
        htmlParts.push('<h3><i class="fas fa-code"></i> ' + escapeHtml(codeBlock.title || '') + '</h3>');
        if (codeBlock.description) {
          htmlParts.push('<p>' + escapeHtml(codeBlock.description) + '</p>');
        }
        htmlParts.push('<div class="code-container">');
        htmlParts.push('<div class="code-header">');
        htmlParts.push('<span><i class="fas fa-code"></i> ' + escapeHtml(codeBlock.title || '示例代码') + '</span>');
        htmlParts.push('<div class="code-actions">');
        htmlParts.push('<button class="copy-code-btn" title="复制代码到剪贴板"><i class="fas fa-copy"></i> 复制代码</button>');
        htmlParts.push('<button class="run-btn" title="运行JavaScript代码"><i class="fas fa-play"></i> 运行代码</button>');
        htmlParts.push('<button class="clear-output-btn" title="清除输出结果"><i class="fas fa-trash"></i> 清除输出</button>');
        htmlParts.push('</div>');
        htmlParts.push('</div>');
        htmlParts.push('<pre><code class="javascript">' + escapeHtml(codeBlock.code || '') + '</code></pre>');
        htmlParts.push('<div class="output-container">');
        htmlParts.push('<div class="output-title"><i class="fas fa-terminal"></i> 输出结果：</div>');
        htmlParts.push('<div class="output-content"></div>');
        htmlParts.push('</div>');
        htmlParts.push('</div>');
      });
    }
    htmlParts.push('</section>');
  });
  htmlParts.push('</main>');
  htmlParts.push('</div>');
  htmlParts.push('<footer>');
  htmlParts.push('<p>JavaScript课堂笔记 &copy; ' + new Date().getFullYear() + '</p>');
  htmlParts.push('</footer>');
  htmlParts.push('</div>');
  htmlParts.push('<!-- 回到顶部按钮 -->');
  htmlParts.push('<button class="back-to-top" id="backToTopBtn" title="回到顶部" style="position:fixed;bottom:30px;right:30px;background:var(--primary);color:white;border:none;width:50px;height:50px;border-radius:50%;cursor:pointer;display:none;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:all 0.3s ease;z-index:1000;">');
  htmlParts.push('<i class="fas fa-chevron-up"></i>');
  htmlParts.push('</button>');
  const scriptTag = '</' + 'script>';
  htmlParts.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js">' + scriptTag);
  htmlParts.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/languages/javascript.min.js">' + scriptTag);
  htmlParts.push('<script>');
  htmlParts.push('document.addEventListener("DOMContentLoaded", () => {');
  htmlParts.push('  // 代码高亮');
  htmlParts.push('  if (window.hljs) {');
  htmlParts.push('    document.querySelectorAll("pre code").forEach(el => {');
  htmlParts.push('      hljs.highlightElement(el);');
  htmlParts.push('    });');
  htmlParts.push('  }');
  htmlParts.push('  ');
  htmlParts.push('  // 复制功能');
  htmlParts.push('  document.querySelectorAll(".copy-code-btn").forEach(btn => {');
  htmlParts.push('    btn.addEventListener("click", function() {');
  htmlParts.push('      const container = this.closest(".code-container");');
  htmlParts.push('      const code = container.querySelector("code").textContent;');
  htmlParts.push('      ');
  htmlParts.push('      if (navigator.clipboard && window.isSecureContext) {');
  htmlParts.push('        navigator.clipboard.writeText(code).then(() => {');
  htmlParts.push('          const originalText = this.innerHTML;');
  htmlParts.push('          this.innerHTML = "<i class=\\"fas fa-check\\"></i> 已复制!";');
  htmlParts.push('          this.style.backgroundColor = "#27ae60";');
  htmlParts.push('          this.style.color = "white";');
  htmlParts.push('          setTimeout(() => {');
  htmlParts.push('            this.innerHTML = originalText;');
  htmlParts.push('            this.style.backgroundColor = "";');
  htmlParts.push('            this.style.color = "";');
  htmlParts.push('          }, 2000);');
  htmlParts.push('        });');
  htmlParts.push('      } else {');
  htmlParts.push('        const textArea = document.createElement("textarea");');
  htmlParts.push('        textArea.value = code;');
  htmlParts.push('        textArea.style.position = "fixed";');
  htmlParts.push('        textArea.style.left = "-999999px";');
  htmlParts.push('        document.body.appendChild(textArea);');
  htmlParts.push('        textArea.focus();');
  htmlParts.push('        textArea.select();');
  htmlParts.push('        document.execCommand("copy");');
  htmlParts.push('        document.body.removeChild(textArea);');
  htmlParts.push('        const originalText = this.innerHTML;');
  htmlParts.push('        this.innerHTML = "<i class=\\"fas fa-check\\"></i> 已复制!";');
  htmlParts.push('        this.style.backgroundColor = "#27ae60";');
  htmlParts.push('        this.style.color = "white";');
  htmlParts.push('        setTimeout(() => {');
  htmlParts.push('          this.innerHTML = originalText;');
  htmlParts.push('          this.style.backgroundColor = "";');
  htmlParts.push('          this.style.color = "";');
  htmlParts.push('        }, 2000);');
  htmlParts.push('      }');
  htmlParts.push('    });');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  // 运行代码功能');
  htmlParts.push('  document.querySelectorAll(".run-btn").forEach(btn => {');
  htmlParts.push('    btn.addEventListener("click", function() {');
  htmlParts.push('      const container = this.closest(".code-container");');
  htmlParts.push('      const code = container.querySelector("code");');
  htmlParts.push('      const output = container.querySelector(".output-content");');
  htmlParts.push('      container.querySelector(".output-container").style.display = "block";');
  htmlParts.push('      output.innerHTML = "";');
  htmlParts.push('      const originalLog = console.log;');
  htmlParts.push('      console.log = function() { output.innerHTML += "<div>" + Array.from(arguments).join(" ") + "</div>"; };');
  htmlParts.push('      try { ');
  htmlParts.push('        const strictCode = "\'use strict\';\\n" + code.textContent;');
  htmlParts.push('        new Function(strictCode)(); ');
  htmlParts.push('        if (output.innerHTML.trim() === "") {');
  htmlParts.push('          output.innerHTML = "<div style=\\"color:#27ae60\\"><i class=\\"fas fa-check-circle\\"></i> 代码执行成功（无输出）</div>";');
  htmlParts.push('        }');
  htmlParts.push('      }');
  htmlParts.push('      catch(e) { ');
  htmlParts.push('        let errorType = e.name || "错误";');
  htmlParts.push('        if (e instanceof SyntaxError) errorType = "语法错误";');
  htmlParts.push('        else if (e instanceof ReferenceError) errorType = "引用错误";');
  htmlParts.push('        else if (e instanceof TypeError) errorType = "类型错误";');
  htmlParts.push('        else if (e instanceof RangeError) errorType = "范围错误";');
  htmlParts.push('        output.innerHTML = "<div style=\\"color:#e74c3c;padding:10px;background:rgba(231,76,60,0.1);border-radius:5px;border-left:4px solid #e74c3c\\"><div style=\\"font-weight:bold;margin-bottom:5px\\"><i class=\\"fas fa-exclamation-triangle\\"></i> " + errorType + "</div><div style=\\"font-family:monospace;font-size:0.9em\\">" + e.message + "</div></div>";');
  htmlParts.push('      }');
  htmlParts.push('      finally { console.log = originalLog; }');
  htmlParts.push('    });');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  // 清除输出功能');
  htmlParts.push('  document.querySelectorAll(".clear-output-btn").forEach(btn => {');
  htmlParts.push('    btn.addEventListener("click", function() {');
  htmlParts.push('      const container = this.closest(".code-container");');
  htmlParts.push('      const output = container.querySelector(".output-content");');
  htmlParts.push('      const outputContainer = container.querySelector(".output-container");');
  htmlParts.push('      output.innerHTML = "";');
  htmlParts.push('      outputContainer.style.display = "none";');
  htmlParts.push('      showNotification("输出已清除", "info");');
  htmlParts.push('    });');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  // 目录导航功能');
  htmlParts.push('  document.querySelectorAll(".toc a").forEach(link => {');
  htmlParts.push('    link.addEventListener("click", function(e) {');
  htmlParts.push('      e.preventDefault();');
  htmlParts.push('      const targetId = this.getAttribute("href").substring(1);');
  htmlParts.push('      const targetSection = document.getElementById(targetId);');
  htmlParts.push('      if (targetSection) {');
  htmlParts.push('        targetSection.scrollIntoView({ behavior: "smooth" });');
  htmlParts.push('        // 更新活动状态');
  htmlParts.push('        document.querySelectorAll(".toc a").forEach(a => a.classList.remove("active"));');
  htmlParts.push('        this.classList.add("active");');
  htmlParts.push('      }');
  htmlParts.push('    });');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  // 通知功能');
  htmlParts.push('  function showNotification(message, type = "info") {');
  htmlParts.push('    const notification = document.createElement("div");');
  htmlParts.push('    notification.className = `notification ${type}`;');
  htmlParts.push('    notification.innerHTML = `<div class="notification-content"><i class="fas fa-info-circle"></i> ${message}</div>`;');
  htmlParts.push('    document.body.appendChild(notification);');
  htmlParts.push('    setTimeout(() => notification.classList.add("show"), 100);');
  htmlParts.push('    setTimeout(() => {');
  htmlParts.push('      notification.classList.remove("show");');
  htmlParts.push('      setTimeout(() => notification.remove(), 300);');
  htmlParts.push('    }, 3000);');
  htmlParts.push('  }');
  htmlParts.push('  ');
  htmlParts.push('  // 回到顶部功能');
  htmlParts.push('  const backToTopBtn = document.getElementById("backToTopBtn");');
  htmlParts.push('  window.addEventListener("scroll", () => {');
  htmlParts.push('    if (window.pageYOffset > 300) {');
  htmlParts.push('      backToTopBtn.style.display = "flex";');
  htmlParts.push('    } else {');
  htmlParts.push('      backToTopBtn.style.display = "none";');
  htmlParts.push('    }');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  backToTopBtn.addEventListener("click", () => {');
  htmlParts.push('    window.scrollTo({ top: 0, behavior: "smooth" });');
  htmlParts.push('  });');
  htmlParts.push('});');
  htmlParts.push(scriptTag);
  htmlParts.push('</body>');
  htmlParts.push('</html>');
  const htmlContent = htmlParts.join('\n');
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  a.download = `javascript-notes-${timestamp}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification('HTML文件已导出！文件名：' + a.download, 'success');
}

function showNotification(message, type) {
  const existingNote = document.querySelector('.notification');
  if (existingNote) existingNote.remove();
  const note = document.createElement('div');
  note.className = 'notification ' + (type || 'info');
  const content = document.createElement('div');
  content.className = 'notification-content';
  const icon = document.createElement('i');
  icon.className = 'fas fa-' + (type === 'success' ? 'check-circle' : 'info-circle');
  const span = document.createElement('span');
  span.textContent = message || '';
  content.appendChild(icon);
  content.appendChild(span);
  note.appendChild(content);
  document.body.appendChild(note);
  setTimeout(() => {
    note.style.opacity = '1';
    note.style.transform = 'translateY(0)';
  }, 10);
  setTimeout(() => {
    note.style.opacity = '0';
    note.style.transform = 'translateY(-20px)';
    setTimeout(() => note.remove(), 300);
  }, 3000);
}

function updateActiveTocItem() {
  // 获取所有章节元素
  const sections = document.querySelectorAll('.note-section');
  const tocLinks = document.querySelectorAll('.toc-link');
  
  if (sections.length === 0) return;
  
  // 找到当前可见的章节
  let currentSectionId = null;
  const scrollPosition = window.pageYOffset + 100; // 添加偏移量
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      currentSectionId = section.id;
    }
  });
  
  // 如果没有找到当前章节，默认选择第一个可见的
  if (!currentSectionId && sections.length > 0) {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.offsetTop + section.offsetHeight > scrollPosition) {
        currentSectionId = section.id;
        break;
      }
    }
  }
  
  // 更新目录中的活跃状态
  if (currentSectionId) {
    tocLinks.forEach(link => {
      link.classList.remove('active');
      if (link.dataset.sectionId === currentSectionId) {
        link.classList.add('active');
      }
    });
  }
}

function toggleComment(cm) {
  // 获取当前选中的内容
  const selections = cm.getSelections();
  const cursor = cm.getCursor();
  
  if (selections.length === 1 && selections[0] === '') {
    // 没有选中内容，切换当前行注释
    toggleLineComment(cm, cursor.line);
  } else {
    // 有选中内容，切换选中区域的注释
    toggleSelectionComment(cm);
  }
}

function toggleLineComment(cm, lineNum) {
  const line = cm.getLine(lineNum);
  const trimmedLine = line.trim();
  
  if (trimmedLine.startsWith('//')) {
    // 取消注释：移除 // 和后面的空格
    const newLine = line.replace(/^(\s*)\/\/\s?/, '$1');
    cm.replaceRange(newLine, {line: lineNum, ch: 0}, {line: lineNum, ch: line.length});
  } else {
    // 添加注释：在行首添加 //
    const indent = line.match(/^\s*/)[0];
    const content = line.substring(indent.length);
    const newLine = indent + '// ' + content;
    cm.replaceRange(newLine, {line: lineNum, ch: 0}, {line: lineNum, ch: line.length});
  }
}

function toggleSelectionComment(cm) {
  const selections = cm.listSelections();
  
  selections.forEach(selection => {
    const from = selection.anchor;
    const to = selection.head;
    const startLine = Math.min(from.line, to.line);
    const endLine = Math.max(from.line, to.line);
    
    // 检查选中的行是否都已经被注释
    let allCommented = true;
    for (let i = startLine; i <= endLine; i++) {
      const line = cm.getLine(i).trim();
      if (line !== '' && !line.startsWith('//')) {
        allCommented = false;
        break;
      }
    }
    
    // 批量切换注释
    for (let i = startLine; i <= endLine; i++) {
      const line = cm.getLine(i);
      if (line.trim() !== '') { // 跳过空行
        if (allCommented) {
          // 取消注释
          const newLine = line.replace(/^(\s*)\/\/\s?/, '$1');
          cm.replaceRange(newLine, {line: i, ch: 0}, {line: i, ch: line.length});
        } else {
          // 添加注释
          const indent = line.match(/^\s*/)[0];
          const content = line.substring(indent.length);
          const newLine = indent + '// ' + content;
          cm.replaceRange(newLine, {line: i, ch: 0}, {line: i, ch: line.length});
        }
      }
    }
  });
}

function showKeyboardShortcuts() {
  // 移除现有的快捷键帮助窗口
  const existingHelp = document.querySelector('.keyboard-shortcuts-modal');
  if (existingHelp) existingHelp.remove();
  
  // 创建快捷键帮助模态窗口
  const modal = document.createElement('div');
  modal.className = 'keyboard-shortcuts-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-keyboard"></i> 键盘快捷键</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="shortcut-list">
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + S</span>
              <span class="shortcut-desc">保存笔记</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + N</span>
              <span class="shortcut-desc">添加新章节</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + E</span>
              <span class="shortcut-desc">导出HTML</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">F1</span>
              <span class="shortcut-desc">显示快捷键帮助</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">右下角按钮</span>
              <span class="shortcut-desc">回到顶部 (双击快速滚动)</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + /</span>
              <span class="shortcut-desc">切换代码注释 (在代码编辑器中)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 关闭模态窗口的事件
  const closeModal = () => modal.remove();
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
    if (e.target === modal.querySelector('.modal-overlay')) closeModal();
  });
  
  // ESC键关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  // 显示动画
  setTimeout(() => {
    modal.style.opacity = '1';
    modal.querySelector('.modal-content').style.transform = 'scale(1)';
  }, 10);
}

// 复制成功的视觉反馈
function showCopySuccess(buttonElement) {
  const originalText = buttonElement.innerHTML;
  const originalClass = buttonElement.className;
  
  // 临时改变按钮样式和文本
  buttonElement.innerHTML = '<i class="fas fa-check"></i> 已复制!';
  buttonElement.style.backgroundColor = '#27ae60';
  buttonElement.style.color = 'white';
  
  // 显示成功通知
  showNotification('代码已复制到剪贴板！', 'success');
  
  // 2秒后恢复原样
  setTimeout(() => {
    buttonElement.innerHTML = originalText;
    buttonElement.className = originalClass;
    buttonElement.style.backgroundColor = '';
    buttonElement.style.color = '';
  }, 2000);
}

// 传统的复制到剪贴板方法（兼容旧浏览器）
function fallbackCopyToClipboard(text, buttonElement) {
  // 创建临时的textarea元素
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  
  try {
    // 选择并复制文本
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    
    if (successful) {
      showCopySuccess(buttonElement);
    } else {
      showNotification('复制失败，请手动复制代码', 'error');
    }
  } catch (err) {
    console.error('复制失败:', err);
    showNotification('复制失败，请手动复制代码', 'error');
  } finally {
    // 清理临时元素
    document.body.removeChild(textArea);
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);