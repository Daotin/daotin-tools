import { createCn } from 'cn/config'

/**
 * 项目自定义的字号（--text-stat 等）长得像颜色类，tailwind-merge 默认会把
 * `cn('text-stat', 'text-tool-solid')` 判成同组，前者被后者吞掉。
 * 这里把它们显式声明为 font-size 组，字号和颜色就能共存。
 */
export const cn = createCn({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'display-sm',
            'stat',
            'title',
            'heading',
            'body',
            'body-sm',
            'caption',
            'label',
          ],
        },
      ],
    },
  },
})
